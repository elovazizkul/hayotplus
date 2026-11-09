// ============================================================
//  NATIJALAR BOTI (Telegram) — alohida jarayon: node server/bot/index.js
// ============================================================
//  1-bosqich: saytdagi "Telegram'ga yuborish" → /start <kalit> → rozilik → PDF.
//  Natija hali tayyor bo'lmasa — "Tekshirish" tugmasi (avtomatik tekshirish — 2-bosqich).
//  Bot Telegram'dan yangi xabarlarni o'zi so'raydi (long polling): serverda yangi manzil ochilmaydi.
//  Token, nom va yoqish/o'chirish — admin panel → "Natijalar boti".
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

const CHECK_GAP_SECONDS = 30; // bir blankni 30 soniyada bir martadan ko'p tekshirmaymiz
const KEEP_DAYS = 30; // laboratoriya kaliti shuncha kundan keyin o'chiriladi

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Xato matnidan laboratoriya kaliti chiqib ketmasin
const safe = (err) => String(err?.message || err).replace(/tmpK=[^&\s"']+/g, 'tmpK=***').slice(0, 300);

let cfg = {};

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

// Tekshirishga ruxsat: buyurtma shu odamniki va oxirgi tekshiruvdan 30 soniya o'tgan
async function claim(orderId, telegramId) {
  const { rows } = await query(
    `UPDATE bot_orders SET last_checked_at = now(), checks = checks + 1
     WHERE id = $1 AND telegram_id = $2
       AND (last_checked_at IS NULL OR last_checked_at < now() - make_interval(secs => $3))
     RETURNING id, lis_id, lis_key`,
    [orderId, telegramId, CHECK_GAP_SECONDS],
  );
  return rows[0] || null;
}

async function deliver(tg, chatId, order, lang) {
  const info = siteInfo();
  const checkButton = [[{ text: say('check', lang), callback_data: `chk:${order.id}` }]];

  let ref = null;
  try {
    ref = order.lis_key ? checkRef(order.lis_id, decrypt(order.lis_key)) : null;
  } catch {
    ref = null;
  }
  if (!ref) return tg.send(chatId, say('gone', lang, info));

  await tg.typing(chatId, 'typing');
  let page;
  try {
    page = await fetchLis(ref);
  } catch (err) {
    console.error('Bot LIS:', safe(err));
    return tg.send(chatId, say('lisError', lang), checkButton);
  }
  if (!page) {
    await query("UPDATE bot_orders SET status = 'failed' WHERE id = $1", [order.id]);
    return tg.send(chatId, say('notFound', lang, info));
  }
  if (page.status === 'pending') {
    track('bot:pending');
    return tg.send(chatId, say('pending', lang), checkButton);
  }

  await tg.typing(chatId);
  let pdf;
  try {
    pdf = await renderPdf(page.html);
  } catch (err) {
    console.error('Bot PDF:', safe(err));
    track('bot:error');
    return tg.send(chatId, say('pdfError', lang, info), checkButton);
  }
  const n = page.lab.number || ref.id;
  const caption = say('caption', lang, { n, d: page.lab.date ? say('date', lang, { d: page.lab.date }) : '', phone: info.phone });
  await tg.sendPdf(chatId, pdf, `HayotPlus-${n}.pdf`, caption);
  await query("UPDATE bot_orders SET status = 'delivered', delivered_at = now() WHERE id = $1", [order.id]);
  track('bot:pdf');
}

async function onMessage(tg, msg) {
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
  if (claimed) await deliver(tg, chatId, claimed, lang);
}

async function onCallback(tg, cb) {
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
  await deliver(tg, chat.id, claimed, lang);
}

function handle(tg, update) {
  const run = update.message ? onMessage(tg, update.message) : update.callback_query ? onCallback(tg, update.callback_query) : null;
  return Promise.resolve(run).catch((err) => {
    console.error('Bot:', safe(err));
    track('bot:error');
  });
}

// Eskirgan bir martalik kalitlar va 30 kundan eski laboratoriya kalitlari o'chiriladi
async function purge() {
  await query("DELETE FROM bot_links WHERE expires_at < now() - interval '1 day'");
  await query(
    'UPDATE bot_orders SET lis_key = NULL WHERE lis_key IS NOT NULL AND coalesce(delivered_at, created_at) < now() - make_interval(days => $1)',
    [KEEP_DAYS],
  );
}

// Jadvallarni sayt (app) yaratadi — migratsiyalar tugaguncha kutamiz
async function waitForTables() {
  for (;;) {
    try {
      await query('SELECT 1 FROM bot_orders LIMIT 1');
      return;
    } catch {
      console.log('Bot: baza hali tayyor emas, kutilmoqda...');
      await sleep(5000);
    }
  }
}

async function main() {
  await waitForTables();
  const runPurge = () => purge().catch((err) => console.error('Bot purge:', safe(err)));
  await runPurge();
  setInterval(runPurge, 12 * 3600000).unref();

  let tg = null;
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
        handle(tg, u); // har bir xabar alohida; PDF lar navbat bilan (pdf.js)
      }
    } catch (err) {
      console.error('Bot:', safe(err));
      // 401 — token noto'g'ri, 409 — shu token bilan boshqa joyda ham bot ishlayapti
      await sleep(err.code === 401 || err.code === 404 ? 60000 : err.code === 409 ? 15000 : 5000);
    }
  }
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

main();
