// ============================================================
//  HAYOT PLUS SERVERI
// ============================================================
//  - tayyor saytni beradi (dist/) va bazadagi ma'lumotni unga qo'shadi
//  - /api/chat, /api/lead — sayt uchun
//  - /api/admin/* — admin panel, /mcp — Claude uchun
//  Kerakli sozlamalar: DATABASE_URL, APP_SECRET, ADMIN_PASSWORD (.env.example)
// ============================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { migrate, query } from './db.js';
import { currentContent, refreshContent } from './content.js';
import { ensureAdmin, seed } from './seed.js';
import { getConfig } from './settings.js';
import { ApiError } from './repo.js';
import { rateLimit } from './security.js';
import admin from './admin.js';
import mcp from './mcp.js';
import { handleChat } from '../api/chat.js';
import { handleLead } from '../api/lead.js';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

await migrate();
await seed();
await ensureAdmin();
await refreshContent();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // oldida bitta proksi (Caddy)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/healthz', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

const json = express.json({ limit: '200kb' });

// Kunlik AI chegarasi: Claude kalitidagi xarajatni nazorat qiladi
const usage = { day: '', count: 0 };
function underDailyLimit(limit) {
  const day = new Date().toISOString().slice(0, 10);
  if (usage.day !== day) Object.assign(usage, { day, count: 0 });
  if (usage.count >= limit) return false;
  usage.count += 1;
  return true;
}

app.post('/api/chat', rateLimit({ windowMs: 60000, max: 20 }), json, async (req, res, next) => {
  try {
    const cfg = await getConfig();
    if (cfg['ai.enabled'] !== 'true' || !underDailyLimit(Number(cfg['ai.daily_limit']) || 0)) {
      return res.status(503).json({ error: 'AI is not available' }); // sayt tayyor javoblarga o'tadi
    }
    await handleChat(req, res, {
      apiKey: cfg['ai.api_key'],
      model: cfg['ai.model'],
      maxTokens: Number(cfg['ai.max_tokens']) || 600,
      instructions: cfg['ai.instructions'],
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/lead', rateLimit({ windowMs: 60000, max: 10 }), json, async (req, res, next) => {
  try {
    const cfg = await getConfig();
    await handleLead(req, res, {
      token: cfg['telegram.bot_token'],
      chatId: cfg['telegram.chat_id'],
      webhook: cfg['lead.webhook_url'],
      save: async (l) => {
        const { rows } = await query(
          `INSERT INTO leads (type, name, phone, lang, vaccine, preferred_time, branch, message, tests, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
          [l.type, l.name, l.phone, l.lang, l.vaccine, l.datetime, l.branch, l.message, JSON.stringify(l.tests), l.total],
        );
        return rows[0].id;
      },
      markDelivered: (id) => query('UPDATE leads SET delivered = true WHERE id = $1', [id]),
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api/admin', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
}, json, admin);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use('/mcp', express.json({ limit: '1mb' }), mcp);

// ---- Sayt ----
const template = readFileSync(`${DIST}index.html`, 'utf8');

// Ma'lumotni HTML ichiga qo'shamiz: sayt qo'shimcha so'rovsiz, darhol to'g'ri narxlar bilan ochiladi
const renderIndex = () => {
  const content = currentContent();
  const data = JSON.stringify(content).replace(/</g, '\\u003c');
  // Admin panelda tanlangan ikonkalar ham shriftga kirsin
  const icons = [...content.packages, ...content.vaccines, ...content.branches].map((x) => x.icon).filter((x) => /^[a-z0-9_]+$/.test(x));
  return template
    .replace(/icon_names=([a-z0-9_,]+)/, (_, names) => `icon_names=${[...new Set([...names.split(','), ...icons])].sort().join(',')}`)
    .replace('</head>', () => `<script>window.__CONTENT__=${data}</script></head>`);
};

app.use(
  express.static(DIST, {
    index: false,
    setHeaders: (res, path) => {
      if (path.includes('/assets/') || path.includes('\\assets\\')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);

app.get('*', (req, res) => {
  if (/\.[a-z0-9]+$/i.test(req.path)) return res.status(404).end('Not found');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  if (req.path.startsWith('/admin')) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(renderIndex());
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Body too large' });
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server xatosi' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Hayot Plus: port ${PORT}`));
