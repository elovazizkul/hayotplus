// ============================================================
//  /api/lead — saytdagi arizalarni Telegram'ga yuborish
// ============================================================
//  "Emlashga yozilish" va "Aloqa" formalari shu yerga keladi va
//  Telegram guruhingizga xabar bo'lib tushadi.
//  Kerakli sozlamalar (Vercel → Settings → Environment Variables):
//    TELEGRAM_BOT_TOKEN — @BotFather bergan token
//    TELEGRAM_CHAT_ID   — xabar boradigan guruh/kanal ID
//    LEAD_WEBHOOK_URL   — ixtiyoriy: n8n Webhook manzili (JSON yuboriladi)
// ============================================================

const clip = (v, n = 300) => String(v ?? '').trim().slice(0, n);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/ /g, ' ') + ' soʻm';

function formatDate(v) {
  // "2026-11-02T10:30" → "02.11.2026 10:30"
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || '');
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : v;
}

// cfg: { token, chatId, webhook, save } — save(lead) arizani bazaga yozadi va
// yozuv ID sini qaytaradi; markDelivered(id) Telegram'ga yetganini belgilaydi.
export async function handleLead(req, res, cfg) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let b = req.body;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  b = b || {};

  // Spam-bot ko'rinmas maydonni to'ldirgan bo'lsa — jimgina "ok" qaytaramiz
  if (clip(b.company)) return res.status(200).json({ ok: true });

  const type = b.type === 'vaccine' ? 'vaccine' : 'contact';
  const name = clip(b.name, 80);
  const phone = clip(b.phone, 25);
  if (!name || phone.replace(/\D/g, '').length < 9) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const lead = {
    type,
    name,
    phone,
    lang: b.lang === 'ru' ? 'ru' : 'uz',
    vaccine: clip(b.vaccine, 120),
    datetime: clip(b.datetime, 30),
    branch: clip(b.branch, 200),
    message: clip(b.message, 1000),
    tests: Array.isArray(b.tests) ? b.tests.slice(0, 30).map((x) => ({ name: clip(x?.name, 150), price: Number(x?.price) || 0 })) : [],
    total: Number(b.total) || 0,
    createdAt: new Date().toISOString(),
    source: 'website',
  };

  // ---- Telegram xabari ----
  const lines = [];
  if (type === 'vaccine') {
    lines.push('💉 <b>Emlashga yangi yozilish</b>', '');
    lines.push(`👤 <b>Ism:</b> ${esc(name)}`);
    lines.push(`📞 <b>Telefon:</b> ${esc(phone)}`);
    if (lead.vaccine) lines.push(`🧪 <b>Vaksina:</b> ${esc(lead.vaccine)}`);
    if (lead.datetime) lines.push(`🗓 <b>Vaqt:</b> ${esc(formatDate(lead.datetime))}`);
    if (lead.branch) lines.push(`📍 <b>Filial:</b> ${esc(lead.branch)}`);
  } else {
    lines.push('📩 <b>Saytdan yangi murojaat</b>', '');
    lines.push(`👤 <b>Ism:</b> ${esc(name)}`);
    lines.push(`📞 <b>Telefon:</b> ${esc(phone)}`);
    if (lead.tests.length) {
      lines.push('', '🧾 <b>Tanlangan tahlillar:</b>');
      lead.tests.forEach((x) => lines.push(`• ${esc(x.name)} — ${money(x.price)}`));
      lines.push(`<b>Jami:</b> ${money(lead.total)}`);
    }
    if (lead.message) lines.push('', `💬 ${esc(lead.message)}`);
  }
  lines.push('', `🌐 Til: ${lead.lang.toUpperCase()}`);

  const { token, chatId, webhook } = cfg;

  let savedId = null;
  if (cfg.save) {
    try {
      savedId = await cfg.save(lead);
    } catch (err) {
      console.error('Lead save failed:', err?.message);
    }
  }

  if (!(token && chatId) && !webhook) {
    if (savedId) return res.status(200).json({ ok: true });
    return res.status(503).json({ error: 'Lead delivery is not configured' });
  }

  const jobs = [];
  if (token && chatId) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
      }).then(async (r) => {
        if (!r.ok) throw new Error('Telegram ' + r.status + ' ' + (await r.text()).slice(0, 200));
      }),
    );
  }
  if (webhook) {
    jobs.push(
      fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(lead),
      }).then((r) => {
        if (!r.ok) throw new Error('Webhook ' + r.status);
      }),
    );
  }

  const results = await Promise.allSettled(jobs);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Lead delivery failed:', r.reason?.message));

  const delivered = results.some((r) => r.status === 'fulfilled');
  if (delivered && savedId && cfg.markDelivered) await cfg.markDelivered(savedId).catch(() => {});

  // Bazaga yozilgan yoki kamida bittasiga yetib borgan bo'lsa — muvaffaqiyatli
  if (delivered || savedId) return res.status(200).json({ ok: true });
  return res.status(502).json({ error: 'Delivery failed' });
}

export default function handler(req, res) {
  return handleLead(req, res, {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    webhook: process.env.LEAD_WEBHOOK_URL,
  });
}
