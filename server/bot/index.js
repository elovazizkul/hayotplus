// ============================================================
//  NATIJALAR BOTI (Telegram) — alohida jarayon: node server/bot/index.js
// ============================================================
//  1-bosqich: saytdagi "Telegram'ga yuborish" → /start <kalit> → rozilik → PDF.
//  2-bosqich: natija hali tayyor bo'lmasa, bot laboratoriya dasturini o'zi tekshiradi
//  (jadval — admin panelda) va tayyor bo'lishi bilan PDF ni o'zi yuboradi. Tunda yubormaydi.
//  N kundan keyin "qolgan natijalarni operator yuboradi" deb bir marta yozadi (autsors tahlillar).
//  Yuborilgandan keyin bir necha kun (admin panelda, standart 3) natija o'zgarmadimi kuzatadi.
//  3-bosqich: alohida rozilik bilan raqamlar bazaga (lab_results, results.js), "Bu kimning tahlili?"
//  (profil, tug'ilgan yil bo'yicha taxmin), /ochirish — bemor hammasini o'chiradi, 20:00 da xodimlarga hisobot.
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
import { profileName, RELATIONS, say } from './texts.js';
import { ageDays, isQuiet, nextPendingCheck, nextWatchCheck, resultHash, scheduleConfig, tashkentHour } from './schedule.js';
import { countRows, logParse, saveResults } from './results.js';

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

function siteBase() {
  const raw = String(cfg['site.url'] || site.url || 'hayotplus.uz').trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(raw) ? raw.replace(/^http:/, 'https:') : `https://${raw}`;
}

function siteInfo() {
  return { phone: cfg['site.phone'] || site.phone, site: `${siteBase()}/natija` };
}

// Mini App tugmasi (PDF ostida va bot menyusida)
const appButton = (lang) => [[{ text: say('openApp', lang), web_app: { url: `${siteBase()}/app` } }]];

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
    logParse(order.id, 'not_found');
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
  await tg.sendPdf(chatId, pdf, `HayotPlus-${n}.pdf`, caption, appButton(lang));

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
  await afterDelivery(chatId, order, page.lab, lang);
}

// ---- 3-bosqich: raqamlarni saqlash va "Bu kimning tahlili?" ----

// PDF yuborilgandan keyin: rozilik bo'lsa — raqamlar bazaga, keyin profil so'raladi; rozilik so'ralmagan bo'lsa — so'raymiz
async function afterDelivery(chatId, order, lab, lang) {
  await setOrder(order.id, { birth_year: lab.birthYear || null });
  const { rows: [user] } = await query('SELECT data_consent FROM bot_users WHERE telegram_id = $1', [order.telegram_id]);
  const parsed = countRows(lab);
  if (user?.data_consent !== true) {
    logParse(order.id, 'ready', { parsed });
    if (user && user.data_consent === null) {
      await tg.send(chatId, say('dataConsent', lang), [[
        { text: say('dataYes', lang), callback_data: `dc:y:${order.id}` },
        { text: say('dataNo', lang), callback_data: `dc:n:${order.id}` },
      ]]);
    }
    return;
  }
  const saved = await saveResults(order.id, lab);
  logParse(order.id, 'ready', { parsed, saved: saved.rows, newAnalytes: saved.newAnalytes });
  track('lab:rows', saved.rows);
  await askProfile(chatId, order.telegram_id, order.id, lang);
}

async function askProfile(chatId, telegramId, orderId, lang, { full = false } = {}) {
  const { rows: [o] } = await query('SELECT patient_id, birth_year FROM bot_orders WHERE id = $1 AND telegram_id = $2', [orderId, telegramId]);
  if (!o || (o.patient_id && !full)) return;
  const { rows: profiles } = await query(
    'SELECT id, relation, label, birth_year FROM bot_patients WHERE telegram_id = $1 ORDER BY id',
    [telegramId],
  );
  await setOrder(orderId, { profile_asked_at: new Date() });

  // Tug'ilgan yil bitta profilga mos kelsa — taxmin qilib so'raymiz
  const guess = o.birth_year ? profiles.filter((p) => p.birth_year === o.birth_year) : [];
  if (!full && guess.length === 1) {
    return tg.send(chatId, say('whoseGuess', lang, { who: profileName(guess[0], lang) }), [[
      { text: say('yes', lang), callback_data: `pg:${orderId}:${guess[0].id}` },
      { text: say('otherPerson', lang), callback_data: `po:${orderId}` },
    ]]);
  }
  const existing = profiles.slice(0, 8).map((p) => [{ text: `👤 ${profileName(p, lang)}`, callback_data: `pg:${orderId}:${p.id}` }]);
  const fresh = RELATIONS.map((rel) => ({ text: `➕ ${profileName({ relation: rel }, lang)}`, callback_data: `pn:${orderId}:${rel}` }));
  const pairs = [];
  for (let i = 0; i < fresh.length; i += 2) pairs.push(fresh.slice(i, i + 2));
  const year = o.birth_year ? say('whoseYear', lang, { y: o.birth_year }) : '';
  return tg.send(chatId, say('whose', lang, { year }), [...existing, ...pairs]);
}

// Rozilik berilgach: shu blank va avval yuborilgan blanklarning raqamlari ham saqlanadi (profil so'ralmaydi —
// keyingi blankda yoki 4-bosqichda Mini App'da tanlanadi)
async function importOrders(telegramId, firstOrderId) {
  const { rows } = await query(
    `SELECT id, lis_id, lis_key FROM bot_orders
     WHERE telegram_id = $1 AND status = 'delivered' AND lis_key IS NOT NULL
     ORDER BY (id = $2) DESC, id`,
    [telegramId, firstOrderId],
  );
  for (const o of rows) {
    try {
      const ref = checkRef(o.lis_id, decrypt(o.lis_key));
      const page = ref ? await fetchLis(ref) : null;
      if (page?.status !== 'ready') continue;
      const saved = await saveResults(o.id, page.lab);
      await setOrder(o.id, { birth_year: page.lab.birthYear || null });
      logParse(o.id, 'ready', { parsed: countRows(page.lab), saved: saved.rows, newAnalytes: saved.newAnalytes });
      track('lab:rows', saved.rows);
    } catch (err) {
      console.error('Bot import:', safe(err));
    }
    await sleep(WORKER_GAP_MS);
  }
}

// ---- 4-bosqich: Mini App'dan kelgan topshiriqlar (bot_jobs) ----

// Blank PDF ini chatga qayta yuborish (holatni o'zgartirmaydi, savol bermaydi)
async function sendBlank(job) {
  const { rows: [o] } = await query(
    'SELECT o.id, o.lis_id, o.lis_key, u.lang FROM bot_orders o JOIN bot_users u USING (telegram_id) WHERE o.id = $1 AND o.telegram_id = $2',
    [job.order_id, job.telegram_id],
  );
  if (!o) return;
  const chatId = job.telegram_id;
  const info = siteInfo();
  let ref = null;
  try {
    ref = o.lis_key ? checkRef(o.lis_id, decrypt(o.lis_key)) : null;
  } catch {
    ref = null;
  }
  if (!ref) return tg.send(chatId, say('gone', o.lang, info));
  await tg.typing(chatId);
  const page = await fetchLis(ref).catch(() => undefined);
  if (page === undefined) return tg.send(chatId, say('lisLater', o.lang));
  if (page?.status !== 'ready') return tg.send(chatId, say('notFound', o.lang, info));
  const pdf = await renderPdf(page.html);
  const n = page.lab.number || ref.id;
  const caption = say('caption', o.lang, { n, d: page.lab.date ? say('date', o.lang, { d: page.lab.date }) : '', phone: info.phone });
  await tg.sendPdf(chatId, pdf, `HayotPlus-${n}.pdf`, caption);
  track('bot:pdf');
}

let jobsBusy = false;
async function runJobs() {
  if (jobsBusy || !tg || !botReady(cfg)) return;
  jobsBusy = true;
  try {
    const { rows } = await query(
      `UPDATE bot_jobs SET done_at = now()
       WHERE id IN (SELECT id FROM bot_jobs WHERE done_at IS NULL ORDER BY id LIMIT 5 FOR UPDATE SKIP LOCKED)
       RETURNING id, kind, telegram_id, order_id`,
    );
    for (const job of rows) {
      try {
        if (job.kind === 'send_pdf') await sendBlank(job);
        else if (job.kind === 'import') await importOrders(job.telegram_id, 0);
      } catch (err) {
        console.error('Bot job:', safe(err));
        await query('UPDATE bot_jobs SET error = $2 WHERE id = $1', [job.id, safe(err).slice(0, 200)]).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Bot jobs:', safe(err));
  } finally {
    jobsBusy = false;
  }
}

// Bemor o'z ma'lumotlarini butunlay o'chiradi: blanklar, raqamlar (CASCADE), profillar, rozilik
function deleteUser(telegramId) {
  return tx(async (c) => {
    await c.query('DELETE FROM bot_links WHERE telegram_id = $1', [telegramId]);
    await c.query('DELETE FROM bot_users WHERE telegram_id = $1', [telegramId]);
  });
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
  if (/^\/(ochirish|delete)(@\w+)?$/i.test(String(msg.text || '').trim())) {
    const lang = await langOf(msg.from);
    return tg.send(chatId, say('deleteAsk', lang), [[
      { text: say('deleteYes', lang), callback_data: 'del:y' },
      { text: say('deleteNo', lang), callback_data: 'del:n' },
    ]]);
  }
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
  const chat = cb.message?.chat;
  const data = String(cb.data || '');
  if (chat?.type !== 'private') return tg.answer(cb.id);
  const lang = await langOf(cb.from);
  const done = async () => {
    await tg.answer(cb.id);
    await tg.removeButtons(chat.id, cb.message.message_id);
  };

  if (data === 'del:y' || data === 'del:n') {
    await done();
    if (data === 'del:n') return tg.send(chat.id, say('deleteCancelled', lang));
    await deleteUser(cb.from.id);
    track('bot:deleted');
    return tg.send(chat.id, say('deleted', lang));
  }

  // ok:<blank> | no:<blank> | chk:<blank> | dc:y|n:<blank> | pg:<blank>:<profil> | po:<blank> | pn:<blank>:<tur>
  const m = data.match(/^(ok|no|chk|po):(\d{1,18})$|^dc:([yn]):(\d{1,18})$|^pg:(\d{1,18}):(\d{1,18})$|^pn:(\d{1,18}):([a-z]{1,10})$/);
  if (!m) return tg.answer(cb.id);
  const action = m[1] || (m[3] ? `dc${m[3]}` : m[5] ? 'pg' : 'pn');
  const orderId = m[2] || m[4] || m[5] || m[7];

  const { rows } = await query('SELECT id FROM bot_orders WHERE id = $1 AND telegram_id = $2', [orderId, cb.from.id]);
  if (!rows[0]) {
    await tg.answer(cb.id);
    return tg.send(chat.id, say('gone', lang, siteInfo()));
  }

  if (action === 'dcy' || action === 'dcn') {
    await done();
    await query('UPDATE bot_users SET data_consent = $2 WHERE telegram_id = $1', [cb.from.id, action === 'dcy']);
    if (action === 'dcn') return tg.send(chat.id, say('dataDeclined', lang));
    await importOrders(cb.from.id, orderId);
    return askProfile(chat.id, cb.from.id, orderId, lang);
  }
  if (action === 'po') {
    await done();
    return askProfile(chat.id, cb.from.id, orderId, lang, { full: true });
  }
  if (action === 'pg' || action === 'pn') {
    let patient;
    if (action === 'pg') {
      ({ rows: [patient] } = await query('SELECT id, relation, label, birth_year FROM bot_patients WHERE id = $1 AND telegram_id = $2', [m[6], cb.from.id]));
    } else if (RELATIONS.includes(m[8])) {
      ({ rows: [patient] } = await query(
        `INSERT INTO bot_patients (telegram_id, relation, birth_year)
         SELECT $1, $2, birth_year FROM bot_orders WHERE id = $3 RETURNING id, relation, label, birth_year`,
        [cb.from.id, m[8], orderId],
      ));
    }
    await done();
    if (!patient) return null;
    await setOrder(orderId, { patient_id: patient.id });
    // Profilda yil bo'lmasa — shu blankdagi yil
    await query(
      'UPDATE bot_patients SET birth_year = o.birth_year FROM bot_orders o WHERE bot_patients.id = $1 AND bot_patients.birth_year IS NULL AND o.id = $2',
      [patient.id, orderId],
    );
    return tg.send(chat.id, say('profileSaved', lang, { who: profileName(patient, lang) }));
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

// ---- Kechki hisobot (20:00, Toshkent) xodimlar guruhiga — arizalar boti (@hayotpluslab_bot) orqali ----
// Ism va raqamlar yo'q, faqat sonlar. Sahifa tuzilishi o'zgarib, parser buzilsa — ogohlantirish.
const SUMMARY_HOUR = 20;
const TODAY = `(now() AT TIME ZONE 'Asia/Tashkent')::date`;

async function dailySummary() {
  if (tashkentHour() !== SUMMARY_HOUR || !cfg['telegram.bot_token'] || !cfg['telegram.chat_id']) return;
  const sent = await query(`SELECT 1 FROM daily_stats WHERE day = ${TODAY} AND metric = 'bot:summary'`);
  if (sent.rows[0]) return;
  const { rows: [s] } = await query(
    `SELECT
       (SELECT coalesce(sum(count), 0) FROM daily_stats WHERE day = ${TODAY} AND metric = 'bot:pdf')::int AS pdf,
       (SELECT coalesce(sum(count), 0) FROM daily_stats WHERE day = ${TODAY} AND metric = 'bot:auto')::int AS auto,
       count(*) FILTER (WHERE outcome = 'ready')::int AS ready,
       count(*) FILTER (WHERE outcome = 'not_found')::int AS not_found,
       coalesce(sum(rows_saved), 0)::int AS saved,
       coalesce(sum(new_analytes), 0)::int AS new_analytes,
       (SELECT count(*) FROM bot_orders WHERE status = 'pending' AND next_check_at IS NOT NULL)::int AS waiting
     FROM parse_log WHERE (created_at AT TIME ZONE 'Asia/Tashkent')::date = ${TODAY}`,
  );
  track('bot:summary'); // bugun qayta yuborilmasin
  if (!s.pdf && !s.ready && !s.not_found) return; // voqea bo'lmagan kun — jim
  const lines = [
    `📊 Natijalar boti — bugungi hisobot`,
    `PDF yuborildi: ${s.pdf} (shundan avtomatik: ${s.auto})`,
    `Raqamlar saqlandi: ${s.saved} qator`,
    `Yangi koʻrsatkich nomlari: ${s.new_analytes}${s.new_analytes ? ' — admin panel → Tahlil koʻrsatkichlari' : ''}`,
    `«Topilmadi» javobi: ${s.not_found}`,
    `Botda kutilmoqda: ${s.waiting}`,
  ];
  if (s.not_found >= 3 && s.not_found > s.ready) {
    lines.push('', '⚠️ «Topilmadi» juda koʻp: laboratoriya dasturi sahifasi oʻzgargan boʻlishi mumkin. Dasturchiga xabar bering.');
  }
  await createTelegram(cfg['telegram.bot_token']).send(cfg['telegram.chat_id'], lines.join('\n'));
}

// Eskirgan bir martalik kalitlar va eski laboratoriya kalitlari o'chiriladi
async function purge() {
  const s = scheduleConfig(cfg);
  const keepDays = Math.max(KEEP_DAYS, s.maxDays, s.watchDays);
  await query("DELETE FROM bot_links WHERE expires_at < now() - interval '1 day'");
  await query("DELETE FROM parse_log WHERE created_at < now() - interval '90 days'");
  await query("DELETE FROM bot_jobs WHERE created_at < now() - interval '7 days'");
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
      await query('SELECT 1 FROM bot_jobs LIMIT 1');
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
  setInterval(runJobs, 3000).unref();
  setInterval(() => dailySummary().catch((err) => console.error('Bot summary:', safe(err))), 5 * 60000).unref();

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
        // Telegram'dagi "Menu" tugmasida: ma'lumotlarni o'chirish
        await next.call('setMyCommands', { commands: [{ command: 'ochirish', description: 'Maʼlumotlarimni oʻchirish' }] }).catch(() => {});
        await next.call('setMyCommands', { commands: [{ command: 'ochirish', description: 'Удалить мои данные' }], language_code: 'ru' }).catch(() => {});
        // Chat pastidagi tugma: Mini App "Mening tahlillarim"
        await next.call('setChatMenuButton', {
          menu_button: { type: 'web_app', text: '📊 Tahlillarim', web_app: { url: `${siteBase()}/app` } },
        }).catch((err) => console.error('Bot menu:', safe(err)));
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
