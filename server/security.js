// Parol, token va maxfiy kalitlarni himoyalash

import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCb, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

const secret = process.env.APP_SECRET || '';
if (secret.length < 32) throw new Error('APP_SECRET kamida 32 belgi bo\'lishi kerak');
const KEY = scryptSync(secret, 'hayotplus-settings-v1', 32);

// Bazada kalitlar shifrlangan holda turadi (AES-256-GCM)
export function encrypt(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

export function decrypt(payload) {
  const [v, iv, tag, data] = String(payload).split(':');
  if (v !== 'v1') throw new Error('Unknown secret format');
  const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

export const sha256 = (text) => createHash('sha256').update(text).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

// Oddiy so'rov cheklovi: bitta kalitdan `windowMs` ichida `max` ta so'rov
export function rateLimit({ windowMs, max, key = (req) => req.ip }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, arr] of hits) if (!arr.some((t) => now - t < windowMs)) hits.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    const k = key(req);
    const now = Date.now();
    const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(k, arr);
    if (arr.length > max) return res.status(429).json({ error: 'Juda ko\'p so\'rov. Birozdan keyin urinib ko\'ring.' });
    next();
  };
}
