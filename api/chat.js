// ============================================================
//  /api/chat — AI yordamchi (Vercel serverless funksiya)
// ============================================================
//  Sayt → shu funksiya → Claude API → javob saytga qaytadi.
//  API kalit faqat Vercel serverida saqlanadi, brauzerga chiqmaydi.
//  Kerakli sozlama (Vercel → Settings → Environment Variables):
//    ANTHROPIC_API_KEY   — majburiy
//    ANTHROPIC_MODEL     — ixtiyoriy (standart: claude-haiku-5-5)
//  Kalit kiritilmagan bo'lsa, sayt avtomatik ravishda tayyor
//  javoblar (src/data/faq.js) bilan ishlayveradi.
// ============================================================

import { buildSystemPrompt } from '../src/data/knowledge.js';

const MAX_HISTORY = 10; // AI'ga yuboriladigan oxirgi xabarlar soni
const MAX_CHARS = 1000; // bitta xabar uzunligi chegarasi

// Claude'ga bitta so'rov. Xato bo'lsa, sababini qaytaradi (admin paneldagi tekshiruv uchun).
export async function askClaude({ apiKey, model, maxTokens = 600, system, messages, timeoutMs = 25000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: model || 'claude-haiku-5-5', max_tokens: maxTokens, system, messages }),
      signal: ctrl.signal,
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, status: 502, error: data?.error?.message || `HTTP ${r.status}` };
    const reply = (data?.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();
    if (!reply) return { ok: false, status: 502, error: 'Empty AI reply' };
    return { ok: true, reply };
  } catch (err) {
    return { ok: false, status: 504, error: err?.name === 'AbortError' ? 'AI timeout' : err?.message || 'Network error' };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleChat(req, res, cfg) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!cfg.apiKey) return res.status(503).json({ error: 'AI is not configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const lang = body?.lang === 'ru' ? 'ru' : 'uz';
  const raw = Array.isArray(body?.messages) ? body.messages : [];
  const messages = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'No user message' });
  }

  const extra = cfg.instructions?.trim();
  const system = buildSystemPrompt(lang) + (extra ? `\n\nQO'SHIMCHA KO'RSATMALAR:\n${extra}` : '');
  const result = await askClaude({ apiKey: cfg.apiKey, model: cfg.model, maxTokens: cfg.maxTokens, system, messages });
  if (!result.ok) {
    console.error('Anthropic API error', result.status, result.error);
    return res.status(result.status).json({ error: 'AI request failed' });
  }
  return res.status(200).json({ reply: result.reply });
}

export default function handler(req, res) {
  return handleChat(req, res, { apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL });
}
