// Sozlamalar: sayt ma'lumotlari, AI, Telegram. Kalitlar bazada shifrlangan
// holda saqlanadi va brauzerga hech qachon qaytarilmaydi.

import { query, tx } from './db.js';
import { audit, ApiError } from './repo.js';
import { decrypt, encrypt } from './security.js';

export const MODELS = [
  { value: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 — arzon va tez (tavsiya)' },
  { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 — aqlliroq, qimmatroq' },
  { value: 'claude-opus-5-5', label: 'Claude Opus 5.5 — eng kuchli, eng qimmat' },
];

export const SETTINGS = [
  { key: 'ai.enabled', group: 'ai', label: 'AI yordamchi yoqilgan', type: 'bool', default: 'true' },
  { key: 'ai.api_key', group: 'ai', label: 'Anthropic API kaliti', type: 'secret', hint: 'console.anthropic.com → API Keys' },
  { key: 'ai.model', group: 'ai', label: 'Model', type: 'select', options: MODELS, default: 'claude-haiku-5-5' },
  { key: 'ai.max_tokens', group: 'ai', label: 'Javob uzunligi chegarasi (token)', type: 'int', default: '600' },
  { key: 'ai.daily_limit', group: 'ai', label: 'Kunlik savollar chegarasi', type: 'int', default: '500', hint: 'Oshib ketsa, chat tayyor javoblarga oʻtadi. Xarajatni nazorat qiladi.' },
  { key: 'ai.instructions', group: 'ai', label: 'Qoʻshimcha koʻrsatmalar', type: 'textarea', hint: 'Yordamchi uslubi, aksiyalar va boshqa qoidalar.' },

  { key: 'telegram.bot_token', group: 'telegram', label: 'Bot tokeni', type: 'secret', hint: '@BotFather → /newbot' },
  { key: 'telegram.chat_id', group: 'telegram', label: 'Chat ID', type: 'text', hint: 'Arizalar shu chat yoki guruhga keladi.' },
  { key: 'lead.webhook_url', group: 'telegram', label: 'n8n Webhook manzili (ixtiyoriy)', type: 'secret' },

  { key: 'site.name', group: 'site', label: 'Sayt nomi', type: 'text' },
  { key: 'site.url', group: 'site', label: 'Sayt manzili', type: 'text' },
  { key: 'site.phone', group: 'site', label: 'Asosiy telefon', type: 'text' },
  { key: 'site.phone2', group: 'site', label: 'Ikkinchi telefon', type: 'text' },
  { key: 'site.telegramBot', group: 'site', label: 'Telegram bot (@ belgisisiz)', type: 'text' },
  { key: 'site.telegramChannel', group: 'site', label: 'Telegram kanal', type: 'text' },
  { key: 'site.instagram', group: 'site', label: 'Instagram', type: 'text' },
  { key: 'site.hours.uz', group: 'site', label: 'Ish vaqti (oʻzbekcha)', type: 'text' },
  { key: 'site.hours.ru', group: 'site', label: 'Ish vaqti (ruscha)', type: 'text' },
  { key: 'site.hoursNote.uz', group: 'site', label: 'Ish vaqti izohi (oʻzbekcha)', type: 'text' },
  { key: 'site.hoursNote.ru', group: 'site', label: 'Ish vaqti izohi (ruscha)', type: 'text' },
  { key: 'site.heroTagline.uz', group: 'site', label: 'Bosh sahifa shiori (oʻzbekcha)', type: 'text' },
  { key: 'site.heroTagline.ru', group: 'site', label: 'Bosh sahifa shiori (ruscha)', type: 'text' },
  { key: 'site.heroImage', group: 'site', label: 'Bosh sahifa rasmi (manzil)', type: 'text' },
  { key: 'site.licenseNumber', group: 'site', label: 'Litsenziya raqami', type: 'text' },
];

const defs = new Map(SETTINGS.map((s) => [s.key, s]));

async function loadRaw() {
  const { rows } = await query('SELECT key, value FROM settings');
  return new Map(rows.map((r) => [r.key, r.value]));
}

export async function getRaw(key) {
  const { rows } = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return rows[0]?.value;
}

export async function setRaw(key, value, client = { query }) {
  await client.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, value],
  );
}

// Server ichida ishlatish uchun — ochilgan qiymatlar
export async function getConfig() {
  const raw = await loadRaw();
  const out = {};
  for (const s of SETTINGS) {
    const v = raw.get(s.key);
    if (s.type === 'secret') {
      try {
        out[s.key] = v ? decrypt(v) : '';
      } catch {
        console.error('Kalitni ochib boʻlmadi (APP_SECRET oʻzgarganmi?):', s.key);
        out[s.key] = '';
      }
    } else {
      out[s.key] = v ?? s.default ?? '';
    }
  }
  return out;
}

// Tashqariga beriladigan ko'rinish: kalitlar o'rnida faqat "bor/yo'q"
export async function viewSettings(groups) {
  const raw = await loadRaw();
  return SETTINGS.filter((s) => !groups || groups.includes(s.group)).map((s) => {
    const { default: _default, ...def } = s;
    return s.type === 'secret' ? { ...def, isSet: Boolean(raw.get(s.key)) } : { ...def, value: raw.get(s.key) ?? s.default ?? '' };
  });
}

function normalize(s, value) {
  const v = String(value ?? '').trim();
  if (s.type === 'bool' && v !== 'true' && v !== 'false') throw new ApiError(400, `${s.label}: true yoki false kerak`);
  if (s.type === 'int' && !/^\d{1,7}$/.test(v)) throw new ApiError(400, `${s.label}: musbat butun raqam kerak`);
  if (s.type === 'select' && !s.options.some((o) => o.value === v)) throw new ApiError(400, `${s.label}: notoʻgʻri qiymat`);
  return v.slice(0, 5000);
}

// values: { 'site.phone': '...', 'ai.api_key': '...' }
// Kalit uchun bo'sh satr — o'chirish, kalit yuborilmasa — o'zgarishsiz.
export async function updateSettings(values, actor, { allowed } = {}) {
  const changed = [];
  await tx(async (c) => {
    for (const [key, value] of Object.entries(values || {})) {
      const s = defs.get(key);
      if (!s) throw new ApiError(400, `Nomaʼlum sozlama: ${key}`);
      if (allowed && !allowed(s)) throw new ApiError(403, `Bu sozlamani oʻzgartirib boʻlmaydi: ${key}`);
      const v = normalize(s, value);
      await setRaw(key, s.type === 'secret' && v ? encrypt(v) : v, c);
      changed.push(key);
    }
    if (changed.length) await audit(c, actor, 'settings', 'settings', '', null, { keys: changed });
  });
  return changed;
}
