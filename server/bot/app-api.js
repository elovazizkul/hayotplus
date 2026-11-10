// Telegram Mini App "Mening tahlillarim" uchun API: /api/app/*
// Kirish parolsiz: Telegram har bir ochilishda imzolangan ma'lumot (initData) beradi, server uni
// bot tokeni bilan tekshiradi. Har bir so'rov faqat shu Telegram foydalanuvchisining ma'lumotini ko'radi.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { query } from '../db.js';
import { getConfig } from '../settings.js';
import { rateLimit } from '../security.js';
import { botReady } from './link.js';
import { parseRefForSex } from './values.js';
import { ALL_AVATARS, AVATAR_COLORS } from '../../src/data/avatars.js';

const MAX_AGE_SEC = 24 * 3600;

// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function verifyInitData(initData, botToken, now = Date.now()) {
  if (!initData || !botToken || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete('hash');
  const check = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = createHmac('sha256', secret).update(check).digest('hex');
  if (!timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const authDate = Number(params.get('auth_date'));
  if (!authDate || now / 1000 - authDate > MAX_AGE_SEC) return null;
  let user = null;
  try {
    user = JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
  return Number.isSafeInteger(user?.id) ? user : null;
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isId = (v) => /^\d{1,18}$/.test(String(v ?? ''));

const router = Router();

router.use(rateLimit({ windowMs: 60000, max: 120 }));

router.use(wrap(async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  const cfg = await getConfig();
  if (!botReady(cfg)) return res.status(503).json({ error: 'disabled' });
  const user = verifyInitData(String(req.get('x-tg-init-data') || ''), cfg['bot.token']);
  if (!user) return res.status(401).json({ error: 'auth' });
  const { rows } = await query('SELECT telegram_id, lang, data_consent FROM bot_users WHERE telegram_id = $1', [user.id]);
  if (!rows[0]) return res.status(403).json({ error: 'no_user' }); // avval botda natija olish kerak
  req.me = rows[0];
  next();
}));

// Profil shu odamnikimi; 'none' — profilsiz blanklar
async function profileOf(req, pid) {
  if (pid === 'none') return { id: null, sex: null };
  if (!isId(pid)) return null;
  const { rows } = await query(
    'SELECT id, relation, label, birth_year, sex, avatar, color FROM bot_patients WHERE id = $1 AND telegram_id = $2',
    [pid, req.me.telegram_id],
  );
  return rows[0] || null;
}

router.get('/me', wrap(async (req, res) => {
  const id = req.me.telegram_id;
  const { rows: profiles } = await query(
    `SELECT p.id, p.relation, p.label, p.birth_year, p.sex, p.avatar, p.color,
            count(DISTINCT o.id) FILTER (WHERE EXISTS (SELECT 1 FROM lab_results r WHERE r.order_id = o.id))::int AS visits
     FROM bot_patients p LEFT JOIN bot_orders o ON o.patient_id = p.id
     WHERE p.telegram_id = $1 GROUP BY p.id ORDER BY p.id`,
    [id],
  );
  const { rows: [none] } = await query(
    `SELECT count(*)::int AS n FROM bot_orders o
     WHERE o.telegram_id = $1 AND o.patient_id IS NULL AND EXISTS (SELECT 1 FROM lab_results r WHERE r.order_id = o.id)`,
    [id],
  );
  res.json({ lang: req.me.lang, dataConsent: req.me.data_consent, profiles, unassigned: none.n });
}));

// Bitta profilning hamma ma'lumoti: ko'rsatkichlar (nuqtalar bilan) va tashriflar.
// Ro'yxat, grafik, tashriflar va solishtirish shu ma'lumotdan brauzerda quriladi.
router.get('/data', wrap(async (req, res) => {
  const p = await profileOf(req, req.query.pid);
  if (!p) return res.status(404).json({ error: 'not_found' });
  const { rows } = await query(
    `SELECT c.id AS aid, c.lis_name, c.name_uz, c.name_ru, c.unit AS c_unit, c.group_title,
            o.id AS order_id, o.lis_id,
            to_char(coalesce(r.measured_on, (o.created_at AT TIME ZONE 'Asia/Tashkent')::date), 'YYYY-MM-DD') AS day,
            r.value_text, r.value_num::float8 AS value_num, r.unit, r.ref_text, r.ref_low::float8 AS ref_low, r.ref_high::float8 AS ref_high
     FROM lab_results r
     JOIN bot_orders o ON o.id = r.order_id
     JOIN lab_analytes a ON a.id = r.analyte_id
     JOIN lab_analytes c ON c.id = coalesce(nullif(a.merged_into, 0), a.id)
     WHERE o.telegram_id = $1 AND ${p.id ? 'o.patient_id = $2' : 'o.patient_id IS NULL'}
     ORDER BY day, r.id`,
    p.id ? [req.me.telegram_id, p.id] : [req.me.telegram_id],
  );
  const { rows: favs } = p.id
    ? await query('SELECT analyte_id FROM patient_favorites WHERE patient_id = $1', [p.id])
    : { rows: [] };
  const fav = new Set(favs.map((f) => Number(f.analyte_id)));

  const analytes = new Map();
  const visits = new Map();
  for (const r of rows) {
    const aid = Number(r.aid);
    if (!analytes.has(aid)) {
      analytes.set(aid, {
        aid, lis_name: r.lis_name, name_uz: r.name_uz, name_ru: r.name_ru, group: r.group_title,
        unit: r.c_unit || r.unit, favorite: fav.has(aid), points: [],
      });
    }
    // Me'yor: blankdagi oddiy oraliq yoki profil jinsi bo'yicha ("Муж < 42, Жен < 32")
    const sexRef = r.ref_low === null && r.ref_high === null ? parseRefForSex(r.ref_text, p.sex) : { low: r.ref_low, high: r.ref_high };
    const num = r.value_num;
    const flag = num === null ? null : sexRef.low !== null && num < sexRef.low ? 'low' : sexRef.high !== null && num > sexRef.high ? 'high' : null;
    analytes.get(aid).points.push({ order_id: Number(r.order_id), day: r.day, text: r.value_text, num, ref: r.ref_text, low: sexRef.low, high: sexRef.high, flag });
    const v = visits.get(Number(r.order_id)) || { id: Number(r.order_id), number: r.lis_id, day: r.day, count: 0 };
    v.count += 1;
    visits.set(v.id, v);
  }
  res.json({
    profile: p,
    analytes: [...analytes.values()],
    visits: [...visits.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : b.id - a.id)),
  });
}));

const RELATIONS = ['self', 'father', 'mother', 'child', 'spouse', 'other'];

// Profilni tahrirlash: nom, kimligi, jinsi, avatar, rang
router.post('/profile', wrap(async (req, res) => {
  const p = await profileOf(req, String(req.body?.pid ?? ''));
  if (!p?.id) return res.status(404).json({ error: 'not_found' });
  const label = req.body?.label === undefined ? undefined : String(req.body.label).replace(/[<>]/g, '').trim().slice(0, 40);
  const sex = req.body?.sex === undefined ? undefined : ['m', 'f'].includes(req.body.sex) ? req.body.sex : null;
  const relation = RELATIONS.includes(req.body?.relation) ? req.body.relation : undefined;
  const avatar = ALL_AVATARS.includes(req.body?.avatar) ? req.body.avatar : undefined;
  const color = Object.hasOwn(AVATAR_COLORS, String(req.body?.color)) ? req.body.color : undefined;
  await query(
    `UPDATE bot_patients SET label = coalesce($2, label), sex = CASE WHEN $3::boolean THEN $4 ELSE sex END,
       relation = coalesce($5, relation), avatar = coalesce($6, avatar), color = coalesce($7, color)
     WHERE id = $1`,
    [p.id, label ?? null, sex !== undefined, sex ?? null, relation ?? null, avatar ?? null, color ?? null],
  );
  res.json({ ok: true });
}));

// Blankni boshqa profilga o'tkazish ('none' — profilsiz)
router.post('/move', wrap(async (req, res) => {
  const orderId = String(req.body?.orderId ?? '');
  const target = await profileOf(req, String(req.body?.pid ?? ''));
  if (!isId(orderId) || !target) return res.status(404).json({ error: 'not_found' });
  const r = await query('UPDATE bot_orders SET patient_id = $3 WHERE id = $1 AND telegram_id = $2', [orderId, req.me.telegram_id, target.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
}));

router.post('/favorite', wrap(async (req, res) => {
  const p = await profileOf(req, String(req.body?.pid ?? ''));
  const aid = String(req.body?.aid ?? '');
  if (!p?.id || !isId(aid)) return res.status(404).json({ error: 'not_found' });
  if (req.body?.on === true) {
    await query(
      `INSERT INTO patient_favorites (patient_id, analyte_id) SELECT $1, id FROM lab_analytes WHERE id = $2 ON CONFLICT DO NOTHING`,
      [p.id, aid],
    );
  } else {
    await query('DELETE FROM patient_favorites WHERE patient_id = $1 AND analyte_id = $2', [p.id, aid]);
  }
  res.json({ ok: true });
}));

// PDF ni chatga yuborish: bot konteyneri (Chromium) bajaradi
router.post('/pdf', rateLimit({ windowMs: 10 * 60000, max: 10, key: (req) => `pdf:${req.me.telegram_id}` }), wrap(async (req, res) => {
  const orderId = String(req.body?.orderId ?? '');
  if (!isId(orderId)) return res.status(400).json({ error: 'bad_request' });
  const r = await query(
    `INSERT INTO bot_jobs (kind, telegram_id, order_id)
     SELECT 'send_pdf', telegram_id, id FROM bot_orders WHERE id = $1 AND telegram_id = $2 AND lis_key IS NOT NULL`,
    [orderId, req.me.telegram_id],
  );
  if (!r.rowCount) return res.status(404).json({ error: 'gone' }); // kalit 30 kundan keyin o'chirilgan
  res.json({ ok: true });
}));

// Raqamlarni saqlashga rozilik (oldin "Yo'q" degan bo'lsa) — avvalgi blanklar import qilinadi
router.post('/consent', wrap(async (req, res) => {
  await query('UPDATE bot_users SET data_consent = true WHERE telegram_id = $1', [req.me.telegram_id]);
  await query("INSERT INTO bot_jobs (kind, telegram_id) VALUES ('import', $1)", [req.me.telegram_id]);
  res.json({ ok: true });
}));

export default router;
