// Admin panel API: /api/admin/...

import { Router } from 'express';
import { query } from './db.js';
import { refreshContent } from './content.js';
import { changePassword, login, logout, requireAdmin } from './auth.js';
import * as repo from './repo.js';
import { resources } from './resources.js';
import { getConfig, updateSettings, viewSettings } from './settings.js';
import { randomToken, rateLimit, sha256 } from './security.js';
import { askClaude } from '../api/chat.js';

const ACTOR = 'admin';
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const admin = Router();

// JSON bo'lmagan so'rovlar rad etiladi — boshqa saytdan yashirin forma yuborib bo'lmaydi
admin.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && !req.is('application/json')) return res.status(415).json({ error: 'JSON kerak' });
  next();
});

admin.post('/login', rateLimit({ windowMs: 5 * 60000, max: 8 }), wrap(login));
admin.use(requireAdmin);
admin.post('/logout', wrap(logout));
admin.post('/password', wrap(changePassword));

admin.get('/me', (req, res) => res.json({ ok: true }));

admin.get('/meta', (req, res) => {
  const list = Object.entries(resources).map(([name, r]) => ({
    name,
    label: r.label,
    ops: r.ops,
    sort: r.sort,
    dir: r.dir || 'asc',
    fields: r.fields,
  }));
  res.json({ resources: list });
});

admin.get('/stats', wrap(async (req, res) => {
  const cfg = await getConfig();
  res.json({
    ...(await repo.stats()),
    aiReady: Boolean(cfg['ai.api_key']) && cfg['ai.enabled'] === 'true',
    telegramReady: Boolean(cfg['telegram.bot_token'] && cfg['telegram.chat_id']),
    recent: (await repo.list('audit', { pageSize: 8 })).items,
  });
}));

// ---- Yozuvlar ----
admin.get('/r/:resource', wrap(async (req, res) => {
  const { q, sort, dir, page, pageSize, ...filters } = req.query;
  res.json(await repo.list(req.params.resource, { q, sort, dir, page, pageSize, filters }));
}));
admin.get('/r/:resource/:id', wrap(async (req, res) => res.json(await repo.get(req.params.resource, req.params.id))));
admin.post('/r/:resource', wrap(async (req, res) => res.status(201).json(await repo.create(req.params.resource, req.body, ACTOR))));
admin.put('/r/:resource/:id', wrap(async (req, res) => res.json(await repo.update(req.params.resource, req.params.id, req.body, ACTOR))));
admin.delete('/r/:resource/:id', wrap(async (req, res) => res.json(await repo.remove(req.params.resource, req.params.id, ACTOR))));

// ---- Sozlamalar ----
admin.get('/settings', wrap(async (req, res) => res.json({ settings: await viewSettings() })));
admin.put('/settings', wrap(async (req, res) => {
  await updateSettings(req.body, ACTOR);
  await refreshContent();
  res.json({ settings: await viewSettings() });
}));

admin.post('/test/ai', wrap(async (req, res) => {
  const cfg = await getConfig();
  if (!cfg['ai.api_key']) return res.status(400).json({ error: 'API kaliti kiritilmagan' });
  const r = await askClaude({
    apiKey: cfg['ai.api_key'],
    model: cfg['ai.model'],
    maxTokens: 30,
    system: 'Answer in one short sentence.',
    messages: [{ role: 'user', content: 'Salom! Ishlayapsanmi?' }],
    timeoutMs: 20000,
  });
  if (!r.ok) return res.status(400).json({ error: `Claude javob bermadi: ${r.error}` });
  res.json({ ok: true, reply: r.reply, model: cfg['ai.model'] });
}));

admin.post('/test/telegram', wrap(async (req, res) => {
  const cfg = await getConfig();
  if (!cfg['telegram.bot_token'] || !cfg['telegram.chat_id']) return res.status(400).json({ error: 'Token yoki Chat ID kiritilmagan' });
  const r = await fetch(`https://api.telegram.org/bot${cfg['telegram.bot_token']}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: cfg['telegram.chat_id'], text: '✅ Hayot Plus admin paneli: Telegram ulandi.' }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => null);
    return res.status(400).json({ error: `Telegram rad etdi: ${data?.description || r.status}` });
  }
  res.json({ ok: true });
}));

// ---- MCP tokenlar ----
admin.get('/mcp-tokens', wrap(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, prefix, can_write, can_read_leads, last_used_at, revoked_at, created_at FROM mcp_tokens ORDER BY created_at DESC',
  );
  res.json({ tokens: rows });
}));

admin.post('/mcp-tokens', wrap(async (req, res) => {
  const name = String(req.body?.name ?? '').trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: 'Nom kiriting' });
  const token = `hp_mcp_${randomToken()}`;
  const { rows } = await query(
    `INSERT INTO mcp_tokens (name, token_hash, prefix, can_write, can_read_leads) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, prefix, can_write, can_read_leads, created_at`,
    [name, sha256(token), token.slice(0, 14), req.body?.can_write === true, req.body?.can_read_leads === true],
  );
  res.status(201).json({ ...rows[0], token }); // to'liq token faqat shu yerda ko'rsatiladi
}));

admin.delete('/mcp-tokens/:id', wrap(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'ID raqam boʻlishi kerak' });
  await query('UPDATE mcp_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL', [req.params.id]);
  res.json({ ok: true });
}));

export default admin;
