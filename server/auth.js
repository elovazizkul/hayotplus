// Admin kirishi: parol → cookie sessiya (bazada faqat token xeshi turadi)

import { query } from './db.js';
import { getRaw, setRaw } from './settings.js';
import { hashPassword, randomToken, sha256, verifyPassword } from './security.js';

const COOKIE = 'hp_session';
const TTL_DAYS = 7;

const readCookie = (req) => {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return '';
};

function setCookie(req, res, value, maxAge) {
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`);
}

export async function login(req, res) {
  const password = String(req.body?.password ?? '');
  const stored = await getRaw('admin.password_hash');
  if (!stored || !(await verifyPassword(password, stored))) {
    return res.status(401).json({ error: 'Parol notoʻgʻri' });
  }
  const token = randomToken();
  await query(`INSERT INTO sessions (token_hash, expires_at) VALUES ($1, now() + interval '${TTL_DAYS} days')`, [sha256(token)]);
  await query('DELETE FROM sessions WHERE expires_at < now()');
  setCookie(req, res, token, TTL_DAYS * 86400);
  res.json({ ok: true });
}

export async function logout(req, res) {
  const token = readCookie(req);
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]);
  setCookie(req, res, '', 0);
  res.json({ ok: true });
}

export async function changePassword(req, res) {
  const { current, next } = req.body || {};
  if (String(next ?? '').length < 10) return res.status(400).json({ error: 'Yangi parol kamida 10 belgi boʻlsin' });
  const stored = await getRaw('admin.password_hash');
  if (!(await verifyPassword(String(current ?? ''), stored))) return res.status(400).json({ error: 'Joriy parol notoʻgʻri' });
  await setRaw('admin.password_hash', await hashPassword(String(next)));
  await query('DELETE FROM sessions'); // boshqa qurilmalardagi sessiyalar yopiladi
  setCookie(req, res, '', 0);
  res.json({ ok: true });
}

export async function requireAdmin(req, res, next) {
  try {
    const token = readCookie(req);
    if (token) {
      const { rows } = await query('SELECT 1 FROM sessions WHERE token_hash = $1 AND expires_at > now()', [sha256(token)]);
      if (rows[0]) return next();
    }
    res.status(401).json({ error: 'Kirish talab qilinadi' });
  } catch (err) {
    next(err);
  }
}
