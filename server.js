// ============================================================
//  Oddiy Node server — Vercel o'rniga o'z serverda ishlatish uchun
// ============================================================
//  - dist/ papkasidagi tayyor saytni beradi (npm run build'dan keyin)
//  - /api/chat va /api/lead ni api/ papkasidagi funksiyalar bilan ishlatadi
//  Ishga tushirish:  node server.js   (PORT, standart 3000)
//  Tashqariga Nginx orqali chiqadi, shuning uchun faqat 127.0.0.1 da tinglaydi.
// ============================================================

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import chat from './api/chat.js';
import lead from './api/lead.js';

const ROOT = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 100 * 1024;

const routes = { '/api/chat': chat, '/api/lead': lead };

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// ---- Spamdan himoya: bitta IP dan daqiqasiga 20 ta so'rov ----
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) if (!arr.some((t) => now - t < 60000)) hits.delete(ip);
}, 60000).unref();

// Vercel uslubidagi res.status().json() ni qo'shib beramiz
function wrap(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(handler, req, res) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests' });
  if (req.method === 'POST') {
    try {
      req.body = await readBody(req);
    } catch {
      return res.status(413).json({ error: 'Body too large' });
    }
  }
  try {
    await handler(req, res);
  } catch (err) {
    console.error('API error:', err?.message);
    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
  }
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = normalize(join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) return res.status(403).end('Forbidden');

  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    file = join(file, 'index.html');
    info = await stat(file).catch(() => null);
  }
  // Fayl topilmasa — bosh sahifa (bitta sahifali sayt)
  if (!info) {
    if (extname(urlPath)) return res.status(404).end('Not found');
    file = join(ROOT, 'index.html');
  }

  const ext = extname(file).toLowerCase();
  const data = await readFile(file);
  res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
  // assets/ ichidagi fayllar nomida hash bor — uzoq saqlash mumkin
  res.setHeader('Cache-Control', urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
  res.end(data);
}

http
  .createServer(async (req, res) => {
    wrap(res);
    const path = (req.url || '/').split('?')[0];
    try {
      if (routes[path]) return await handleApi(routes[path], req, res);
      if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end('Method not allowed');
      return await serveStatic(req, res);
    } catch (err) {
      console.error('Server error:', err?.message);
      if (!res.headersSent) res.status(500).end('Server error');
    }
  })
  .listen(PORT, '127.0.0.1', () => console.log(`Hayot Plus sayti: http://127.0.0.1:${PORT}`));
