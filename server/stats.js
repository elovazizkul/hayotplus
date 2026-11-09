// Tashriflar va AI izoh hisoblagichi — tashqi xizmatlarsiz (Google Analytics va h.k. yo'q), cookie'siz.
// Noyob tashrif buyuruvchi: IP + brauzer + kun → HMAC iz. Iz faqat shu kun uchun kerak, 2 kundan keyin o'chadi.

import { createHmac } from 'node:crypto';
import { query } from './db.js';

const TODAY = `(now() AT TIME ZONE 'Asia/Tashkent')::date`;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|curl|wget|python|headless|lighthouse|monitor/i;

// Hisoblagichni oshiradi. Xato bo'lsa sayt ishlashi to'xtamasin — faqat logga yoziladi.
export function track(metric, n = 1) {
  query(
    `INSERT INTO daily_stats (day, metric, count) VALUES (${TODAY}, $1, $2)
     ON CONFLICT (day, metric) DO UPDATE SET count = daily_stats.count + EXCLUDED.count`,
    [metric, n],
  ).catch((err) => console.error('Stats:', err.message));
}

// Bu kun shu odam birinchi marta keldimi? (scope: 'site' yoki sahifa nomi)
async function firstToday(scope, mark) {
  const r = await query(`INSERT INTO visit_marks (day, scope, mark) VALUES (${TODAY}, $1, $2) ON CONFLICT DO NOTHING`, [scope, mark]);
  return r.rowCount === 1;
}

// Sahifa ochilishi: page — 'home' yoki 'natija'
export function trackVisit(req, page) {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT.test(ua) || req.headers['purpose'] === 'prefetch' || req.headers['sec-purpose']?.includes('prefetch')) return;
  track(`view:${page}`);
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' });
  const mark = createHmac('sha256', process.env.APP_SECRET).update(`${day}|${req.ip}|${ua}`).digest('base64url').slice(0, 22);
  (async () => {
    if (await firstToday('site', mark)) track('uniq:site');
    if (await firstToday(page, mark)) track(`uniq:${page}`);
  })().catch((err) => console.error('Stats:', err.message));
}

export function purgeVisitMarks() {
  return query(`DELETE FROM visit_marks WHERE day < ${TODAY} - 1`);
}

export const METRICS = [
  'view:home', 'uniq:site', 'uniq:home', 'view:natija', 'uniq:natija',
  'results:ok', 'results:notfound', 'results:pending', 'ai:new', 'ai:cached', 'ai:error', 'ai:limit',
  'bot:link', 'bot:start', 'bot:pdf', 'bot:auto', 'bot:updated', 'bot:operator', 'bot:expired', 'bot:pending', 'bot:error',
];

// Oxirgi `days` kun: har kun bo'yicha qatorlar + bugun / 7 / 30 kun / jami yig'indilar
export async function siteStats(days = 30) {
  const d = Math.min(Math.max(Number(days) || 30, 1), 365);
  const { rows } = await query(
    `SELECT to_char(g.day, 'YYYY-MM-DD') AS day, s.metric, s.count
     FROM generate_series(${TODAY} - ($1::int - 1), ${TODAY}, interval '1 day') AS g(day)
     LEFT JOIN daily_stats s ON s.day = g.day::date
     ORDER BY g.day`,
    [d],
  );
  const byDay = new Map();
  for (const r of rows) {
    if (!byDay.has(r.day)) byDay.set(r.day, { day: r.day });
    if (r.metric) byDay.get(r.day)[r.metric] = r.count;
  }
  const totals = await query(
    `SELECT metric,
            sum(count) FILTER (WHERE day = ${TODAY}) AS today,
            sum(count) FILTER (WHERE day > ${TODAY} - 7) AS week,
            sum(count) FILTER (WHERE day > ${TODAY} - 30) AS month,
            sum(count) AS total
     FROM daily_stats GROUP BY metric`,
  );
  const sums = {};
  for (const r of totals.rows) sums[r.metric] = { today: Number(r.today) || 0, week: Number(r.week) || 0, month: Number(r.month) || 0, total: Number(r.total) || 0 };
  return { days: [...byDay.values()], totals: sums, metrics: METRICS };
}
