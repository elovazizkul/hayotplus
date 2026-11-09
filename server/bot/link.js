// Saytdagi "Telegram'ga yuborish" tugmasi: POST /api/bot-link
// Laboratoriya kaliti (tmpK) ~98 belgi — Telegram'ning ?start= (64 belgigacha) ga sig'maydi.
// Shuning uchun o'zimizning qisqa tasodifiy kalitni beramiz, tmpK esa bazada shifrlangan holda turadi.

import { Router } from 'express';
import { query } from '../db.js';
import { getConfig } from '../settings.js';
import { encrypt, randomToken, rateLimit, sha256 } from '../security.js';
import { checkRef, fetchLis } from '../lis.js';
import { track } from '../stats.js';

export const LINK_MINUTES = 15;

export const botUsername = (cfg) => {
  const name = String(cfg['bot.username'] || '').trim().replace(/^@/, '');
  return /^[A-Za-z0-9_]{5,32}$/.test(name) ? name : '';
};

export const botReady = (cfg) => cfg['bot.enabled'] === 'true' && Boolean(cfg['bot.token']) && Boolean(botUsername(cfg));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

router.post('/bot-link', rateLimit({ windowMs: 10 * 60000, max: 10 }), wrap(async (req, res) => {
  const ref = checkRef(req.body?.id, req.body?.key);
  const lang = req.body?.lang === 'ru' ? 'ru' : 'uz';
  if (!ref) return res.status(400).json({ error: 'bad_link' });
  res.setHeader('Cache-Control', 'no-store');

  const cfg = await getConfig();
  if (!botReady(cfg)) return res.status(503).json({ error: 'disabled' });

  // Kalit faqat laboratoriya dasturi tasdiqlagan kvitansiya uchun beriladi (tayyor yoki hali tayyor emas)
  const page = await fetchLis(ref).catch(() => undefined);
  if (page === undefined) return res.status(502).json({ error: 'lis_unavailable' });
  if (!page) return res.status(404).json({ error: 'not_found' });

  const key = randomToken(24); // 32 belgi: A-Z a-z 0-9 _ -
  await query(
    `INSERT INTO bot_links (key_hash, lis_id, lis_key, lang, expires_at)
     VALUES ($1, $2, $3, $4, now() + make_interval(mins => $5))`,
    [sha256(key), ref.id, encrypt(ref.key), lang, LINK_MINUTES],
  );
  track('bot:link');
  res.json({ url: `https://t.me/${botUsername(cfg)}?start=${key}` });
}));

export default router;
