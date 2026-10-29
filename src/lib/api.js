// Saytdan Vercel serverless funksiyalariga (/api/...) so'rov yuborish

async function postJSON(url, data, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal,
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* javob JSON emas */
    }
    if (!res.ok) throw new Error((json && json.error) || `HTTP ${res.status}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// Ariza (emlash / aloqa formasi) → Telegram guruhingizga
export const sendLead = (payload) => postJSON('/api/lead', payload, 15000);

// AI yordamchi → Claude API
export async function askAi(messages, lang) {
  const json = await postJSON('/api/chat', { messages, lang }, 35000);
  if (!json || typeof json.reply !== 'string' || !json.reply.trim()) throw new Error('Empty reply');
  return json.reply.trim();
}

export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const phoneDigits = (s) => String(s || '').replace(/\D/g, '');
