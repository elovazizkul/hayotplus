// ============================================================
//  NATIJALAR BOTI (Telegram) — alohida jarayon: node server/bot/index.js
// ============================================================
//  1-bosqich: saytdagi "Telegram'ga yuborish" → /start <kalit> → rozilik → PDF.
//  2-bosqich: natija hali tayyor bo'lmasa, bot laboratoriya dasturini o'zi tekshiradi
//  (jadval — admin panelda) va tayyor bo'lishi bilan PDF ni o'zi yuboradi. Tunda yubormaydi.
//  N kundan keyin "qolgan natijalarni operator yuboradi" deb bir marta yozadi (autsors tahlillar).
//  Yuborilgandan keyin bir necha kun (admin panelda, standart 3) natija o'zgarmadimi kuzatadi.
//  Bot Telegram'dan yangi xabarlarni o'zi so'raydi (long polling): serverda yangi manzil ochilmaydi.
//  Bemor ismi, telefoni saqlanmaydi; laboratoriya kaliti (tmpK) bazada shifrlangan, logga yozilmaydi.
// ============================================================

import { query, tx } from '../db.js';
import { getConfig } from '../settings.js';
import { decrypt, sha256 } from '../security.js';
import { checkRef, fetchLis } from '../lis.js';
import { track } from '../stats.js';
import { site } from '../../src/data/site.js';
import { botReady } from './link.js';
import { createTelegram } from './telegram.js';
import { renderPdf } from './pdf.js';
import { say } from './texts.js';
import { ageDays, isQuiet, nextPendingCheck, nextWatchCheck, resultHash, scheduleConfig } from './schedule.js';

const CHECK_GAP_SECONDS = 30; // bir blankni 30 soniyada bir martadan ko'p tekshirmaymiz
const KEEP_DAYS = 30; // laboratoriya kaliti kamida shuncha kundan keyin o'chiriladi
const RETRY_MINUTES = 30; // laboratoriya dasturi yoki PDF xatosida qayta urinish
// Navbat: har daqiqada vaqti kelgan blanklar birma-bir, orasida pauza — laboratoriya dasturiga yuklama bo'lmasin.
// Daqiqasiga ~60–90 ta tekshiruv: kuniga 300 bemorda ham navbat to'planib qolmaydi (eng og'ir holatda ~40/daqiqa).
const WORKER_EVERY_MS = 60000;
const WORKER_BATCH = 100;
const WORKER_GAP_MS = 400;
const WORKER_BUDGET_MS = 50000; // bitta aylanish 50 soniyadan oshmasin

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Xato matnidan laboratoriya kaliti chiqib ketmasin
const safe = (err) => String(err?.message || err).replace(/tmpK=[^&\s"']+/g, 'tmpK=***').slice(0, 300);

let cfg = {};
let tg = null;

function siteInfo() {
  const raw = String(cfg['site.url'] || site.url || 'hayotplus.uz').trim().replace(/\/+$/, '');
  return { phone: cfg['site.phone'] || site.phone, site: `${/^https?:\/\//.test(raw) ? raw : `https://${raw}`}/natija` };
}

async function langOf(from) {
  const { rows } = await query('SELECT lang FROM bot_users WHERE telegram_id = $1', [from.id]);
  return rows[0]?.lang || (String(from.language_code || '').startsWith('ru') ? 'ru' : 'uz');
}

// Bir martalik kalit: muddati o'tmagan va ishlatilmagan bo'lsa — ishlatilgan deb belgilanadi
function takeLink(key, telegramId) {
  const hash = sha256(key);
  return tx(async (c) => {
    const { rows } = await c.query(
      'SELECT lis_id, lis_key, lang FROM bot_links WHERE key_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE',
      [hash],
    );
    if (!rows[0]?.lis_key) return null;
    await c.query('UPDATE bot_links SET used_at = now(), telegram_id = $2, lis_key = NULL WHERE key_hash = $1', [hash, telegramId]);
    return rows[0];
  });
}

// Tekshirishga ruxsat: buyurtma shu odamniki va oxirgi tekshiruvdan 30 soniya o'tgan.
// Qo'lda ("Tekshirish") va avtomatik tekshiruv bir vaqtga to'g'ri kelsa, PDF ikki marta ketmaydi.
async function claim(orderId, telegramId) {
  const { rows } = await query(
    `UPDATE bot_orders SET last_checked_at = now(), checks = checks + 1
     WHERE id = $1 AND telegram_id = $2
       AND (last_checked_at IS NULL OR last_checked_at < now() - make_interval(secs => $3))
     RETURNING id, telegram_id, lis_id, lis_key, status, result_hash, operator_notified_at, created_at, delivered_at`,
    [orderId, telegramId, CHECK_GAP_SECONDS],
  );
  return rows[0] || null;
}

const setOrder = (id, fields) => {
  const keys = Object.keys(fields);
  return query(
    `UPDATE bot_orders SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1`,
    [id, ...keys.map((k) => fields[k])],
  );
};

const minutesFromNow = (m) => new Date(Date.now() + m * 60000);

// Bitta blankni tekshirish. manual = bemor o'zi so'radi (Start, "Roziman", "Tekshirish") — doim javob beramiz.
// Avtomatik tekshiruvda bemor faqat yangilik bo'lganda xabar oladi: PDF, "yangilandi", "operator yuboradi".
async function checkOrder(chatId, order, lang, manual) {
  const info = siteInfo();
  const s = scheduleConfig(cfg);
  const checkButton = [[{ text: say('check', lang), callback_data: `chk:${order.id}` }]];
  const delivered = order.status === 'delivered';

  let ref = null;
  try {
    ref = order.lis_key ? checkRef(order.lis_id, decrypt(order.lis_key)) : null;
  } catch {
    ref = null;
  }
  if (!ref) {
    await setOrder(order.id, { next_check_at: null });
    if (manual) await tg.send(chatId, say('gone', lang, info));
    return;
  }

  if (manual) await tg.typing(chatId, 'typing');
  let page;
  try {
    page = await fetchLis(ref);
  } catch (err) {
    console.error('Bot LIS:', safe(err));
    await setOrder(order.id, { next_check_at: minutesFromNow(RETRY_MINUTES) });
    if (manual) await tg.send(chatId, say('lisError', lang), checkButton);
    return;
  }

  // Laboratoriya dasturi kalitni rad etdi
  if (!page) {
    await setOrder(order.id, { next_check_at: null, status: delivered ? 'delivered' : 'failed' });
    if (manual || !delivered) await tg.send(chatId, say('notFound', lang, info));
    return;
  }

  if (page.status === 'pending') {
    if (delivered) {
      await setOrder(order.id, { next_check_at: nextWatchCheck(order.delivered_at, s) });
      return;
    }
    const next = nextPendingCheck(order.created_at, s);
    const notifyOperator = !order.operator_notified_at && ageDays(order.created_at) >= s.operatorDays;
    if (notifyOperator) {
      await tg.send(chatId, say('operator', lang, info), checkButton);
      track('bot:operator');
    } else if (manual) {
      await tg.send(chatId, say('pending', lang), checkButton);
    }
    if (manual) track('bot:pending');
    if (!next) track('bot:expired');
    await setOrder(order.id, {
      next_check_at: next,
      status: next ? 'pending' : 'expired',
      ...(notifyOperator ? { operator_notified_at: new Date() } : {}),
    });
    return;
  }

  // Natija tayyor
  const hash = resultHash(page.lab);
  const changed = delivered && Boolean(order.result_hash) && order.result_hash !== hash;
  if (delivered && !changed && !manual) {
    await setOrder(order.id, { result_hash: hash, next_check_at: nextWatchCheck(order.delivered_at, s) });
    return;
  }

  if (manual) await tg.typing(chatId);
  let pdf;
  try {
    pdf = await renderPdf(page.html);
  } catch (err) {
    console.error('Bot PDF:', safe(err));
    track('bot:error');
    await setOrder(order.id, { next_check_at: minutesFromNow(RETRY_MINUTES) });
    if (manual) await tg.send(chatId, say('pdfError', lang, info), checkButton);
    return;
  }
  const n = page.lab.number || ref.id;
  const head = changed ? say('updated', lang) : !delivered && !manual ? say('readyAuto', lang) : '';
  const caption = head + say('caption', lang, { n, d: page.lab.date ? say('date', lang, { d: page.lab.date }) : '', phone: info.phone });
  await tg.sendPdf(chatId, pdf, `HayotPlus-${n}.pdf`, caption);

  const deliveredAt = order.delivered_at || new Date();
  await setOrder(order.id, {
    status: 'delivered',
    delivered_at: deliveredAt,
    result_hash: hash,
    next_check_at: nextWatchCheck(deliveredAt, s),
  });
  track('bot:pdf');
  if (changed) track('bot:updated');
  else if (!delivered && !manual) track('bot:auto');
}

// ---- Avtomatik tekshiruv: vaqti kelgan blanklar navbat bilan ----
let working = false;
async function worker() {
  if (working || !tg || !botReady(cfg) || isQuiet(scheduleConfig(cfg))) return;
  working = true;
  try {
    const { rows } = await query(
      `SELECT o.id, o.telegram_id, u.lang FROM bot_orders o JOIN bot_users u USING (telegram_id)
       WHERE o.next_check_at <= now() AND o.lis_key IS NOT NULL AND u.consent_at IS NOT NULL
       ORDER BY o.next_check_at LIMIT $1`,
      [WORKER_BATCH],
    );
    const started = Date.now();
    for (const row of rows) {
      if (Date.now() - started > WORKER_BUDGET_MS) break; // qolganlari keyingi daqiqada
      const order = await claim(row.id, row.telegram_id);
      if (order) {
        await checkOrder(row.telegram_id, order, row.lang, false).catch(async (err) => {
          console.error('Bot auto:', safe(err));
          track('bot:error');
          // 403 — bemor botni bloklagan: unga boshqa yozmaymiz
          const blocked = err.code === 403;
          await query(
            `UPDATE bot_orders SET next_check_at = ${blocked ? 'NULL' : "now() + interval '30 minutes'"} WHERE ${blocked ? 'telegram_id' : 'id'} = $1`,
            [blocked ? row.telegram_id : row.id],
          ).catch(() => {});
        });
      }
      await sleep(WORKER_GAP_MS);
    }
  } catch (err) {
    console.error('Bot worker:', safe(err));
  } finally {
    working = false;
  }
}

// ---- Bemor xabarlari ----
async function onMessage(msg) {
  if (msg.chat?.type !== 'private' || !msg.from || msg.from.is_bot) return; // guruhlarda ishlamaydi
  const chatId = msg.chat.id;
  const start = String(msg.text || '').trim().match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{20,64})$/);
  if (!start) return tg.send(chatId, say('hello', await langOf(msg.from), siteInfo()));

  track('bot:start');
  const link = await takeLink(start[1], msg.from.id);
  if (!link) return tg.send(chatId, say('expired', await langOf(msg.from), siteInfo()));
  const lang = link.lang === 'ru' ? 'ru' : 'uz';

  const { rows: [user] } = await query(
    `INSERT INTO bot_users (telegram_id, lang) VALUES ($1, $2)
     ON CONFLICT (telegram_id) DO UPDATE SET lang = EXCLUDED.lang RETURNING consent_at`,
    [msg.from.id, lang],
  );
  // Shu blank avval ham ulangan bo'lsa — yangi kalit bilan yangilanadi
  const { rows: [order] } = await query(
    `INSERT INTO bot_orders (telegram_id, lis_id, lis_key) VALUES ($1, $2, $3)
     ON CONFLICT (telegram_id, lis_id) DO UPDATE SET lis_key = EXCLUDED.lis_key, last_checked_at = NULL
     RETURNING id`,
    [msg.from.id, link.lis_id, link.lis_key],
  );

  if (!user.consent_at) {
    return tg.send(chatId, say('consent', lang), [[
      { text: say('agree', lang), callback_data: `ok:${order.id}` },
      { text: say('disagree', lang), callback_data: `no:${order.id}` },
    ]]);
  }
  const claimed = await claim(order.id, msg.from.id);
  if (claimed) await checkOrder(chatId, claimed, lang, true);
}

async function onCallback(cb) {
  const m = String(cb.data || '').match(/^(ok|no|chk):(\d{1,18})$/);
  const chat = cb.message?.chat;
  if (!m || chat?.type !== 'private') return tg.answer(cb.id);
  const [, action, orderId] = m;
  const lang = await langOf(cb.from);

  const { rows } = await query('SELECT id FROM bot_orders WHERE id = $1 AND telegram_id = $2', [orderId, cb.from.id]);
  if (!rows[0]) {
    await tg.answer(cb.id);
    return tg.send(chat.id, say('gone', lang, siteInfo()));
  }

  if (action === 'no') {
    await tg.answer(cb.id);
    await tg.removeButtons(chat.id, cb.message.message_id);
    await query('DELETE FROM bot_orders WHERE id = $1 AND telegram_id = $2 AND delivered_at IS NULL', [orderId, cb.from.id]);
    return tg.send(chat.id, say('declined', lang, siteInfo()));
  }
  if (action === 'ok') {
    await query('UPDATE bot_users SET consent_at = coalesce(consent_at, now()) WHERE telegram_id = $1', [cb.from.id]);
  }

  const claimed = await claim(orderId, cb.from.id);
  if (!claimed) return tg.answer(cb.id, say('wait', lang));
  await tg.answer(cb.id); // Telegram tugma javobini tez kutadi — PDF tayyorlashdan oldin
  await tg.removeButtons(chat.id, cb.message.message_id);
  await checkOrder(chat.id, claimed, lang, true);
}

function handle(update) {
  const run = update.message ? onMessage(update.message) : update.callback_query ? onCallback(update.callback_query) : null;
  return Promise.resolve(run).catch((err) => {
    console.error('Bot:', safe(err));
    track('bot:error');
  });
}

// Eskirgan bir martalik kalitlar va eski laboratoriya kalitlari o'chiriladi
async function purge() {
  const s = scheduleConfig(cfg);
  const keepDays = Math.max(KEEP_DAYS, s.maxDays, s.watchDays);
  await query("DELETE FROM bot_links WHERE expires_at < now() - interval '1 day'");
  await query(
    `UPDATE bot_orders SET lis_key = NULL, next_check_at = NULL
     WHERE lis_key IS NOT NULL AND coalesce(delivered_at, created_at) < now() - make_interval(days => $1)`,
    [keepDays],
  );
}

// Jadvallarni sayt (app) yaratadi — migratsiyalar tugaguncha kutamiz
async function waitForTables() {
  for (;;) {
    try {
      await query('SELECT next_check_at FROM bot_orders LIMIT 1');
      return;
    } catch {
      console.log('Bot: baza hali tayyor emas, kutilmoqda...');
      await sleep(5000);
    }
  }
}

async function main() {
  await waitForTables();
  cfg = await getConfig();
  const runPurge = () => purge().catch((err) => console.error('Bot purge:', safe(err)));
  await runPurge();
  setInterval(runPurge, 12 * 3600000).unref();
  setInterval(worker, WORKER_EVERY_MS).unref();

  let token = '';
  let offset = 0;
  let idle = false;
  for (;;) {
    try {
      cfg = await getConfig();
      if (!botReady(cfg)) {
        if (!idle) console.log('Bot oʻchirilgan yoki sozlanmagan (admin panel → Natijalar boti). Kutilmoqda...');
        idle = true;
        token = '';
        tg = null;
        await sleep(30000);
        continue;
      }
      idle = false;
      if (cfg['bot.token'] !== token) {
        const next = createTelegram(cfg['bot.token']);
        const me = await next.getMe();
        await next.call('deleteWebhook');
        tg = next;
        token = cfg['bot.token'];
        offset = 0;
        console.log(`Bot ishga tushdi: @${me.username}`);
      }
      const updates = await tg.getUpdates(offset);
      for (const u of updates) {
        offset = u.update_id + 1;
        handle(u); // har bir xabar alohida; PDF lar navbat bilan (pdf.js)
      }
    } catch (err) {
      // Telegram ba'zan bir daqiqaga javob bermaydi (502, timeout) — jim qayta ulanamiz
      if (err.code !== 0 && err.code !== 502) console.error('Bot:', safe(err));
      // 401 — token noto'g'ri, 409 — shu token bilan boshqa joyda ham bot ishlayapti
      await sleep(err.code === 401 || err.code === 404 ? 60000 : err.code === 409 ? 15000 : 5000);
    }
  }
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

main();
