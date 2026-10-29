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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI is not configured' });

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

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 600,
        temperature: 0.3,
        system: buildSystemPrompt(lang),
        messages,
      }),
      signal: ctrl.signal,
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) {
      console.error('Anthropic API error', r.status, data?.error?.message);
      return res.status(502).json({ error: 'AI request failed' });
    }
    const reply = (data?.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();
    if (!reply) return res.status(502).json({ error: 'Empty AI reply' });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('AI handler error', err?.name, err?.message);
    return res.status(504).json({ error: 'AI timeout' });
  } finally {
    clearTimeout(timer);
  }
}
