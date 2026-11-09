// QR orqali tahlil natijalari va ularning AI izohi: /api/results, /api/interpret
// Natijalar laboratoriya dasturidan (lis.js) har safar yangidan olinadi — brauzer
// yuborgan raqamlarga ishonilmaydi. AI izohini n8n (HPM interpret) tayyorlaydi.

import { Router } from 'express';
import { query } from './db.js';
import { getConfig } from './settings.js';
import { rateLimit } from './security.js';
import { checkRef, fetchLis, fetchResults } from './lis.js';
import { track } from './stats.js';
import { botReady } from './bot/link.js';

const SPECIALTIES = ['endo', 'cardio', 'neph', 'gastro', 'gyn', 'uro', 'hema', 'gp', 'rheum', 'neuro', 'infect', 'ped', 'none'];
const URGENCY = ['routine', 'soon', 'urgent'];
const KEEP_DAYS = 90;

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Kunlik chegara: n8n orqali OpenAI xarajatini nazorat qiladi
const usage = { day: '', count: 0 };
function underDailyLimit(limit) {
  const day = new Date().toISOString().slice(0, 10);
  if (usage.day !== day) Object.assign(usage, { day, count: 0 });
  if (usage.count >= limit) return false;
  usage.count += 1;
  return true;
}

const flat = (lab) => lab.groups.flatMap((g) => g.items.map(({ name, value, unit, ref }) => ({ name, value, unit, ref })));
const str = (s, max = 2000) => String(s ?? '').trim().slice(0, max);

// n8n javobini qat'iy ko'rinishga keltiramiz: sahifaga faqat kutilgan maydonlar chiqadi
function cleanAnswer(a) {
  if (!a || a.ok !== true) return null;
  return {
    summary: str(a.summary),
    abnormal: (Array.isArray(a.abnormal) ? a.abnormal : []).slice(0, 50).map((x) => ({
      name: str(x?.name, 200),
      value: str(x?.value, 100),
      flag: x?.flag === 'low' ? 'low' : 'high',
      comment: str(x?.comment, 500),
    })).filter((x) => x.name),
    specialty: SPECIALTIES.includes(a.specialty) ? a.specialty : 'gp',
    specialty_name: str(a.specialty_name, 60),
    urgency: URGENCY.includes(a.urgency) ? a.urgency : 'routine',
    advice: str(a.advice, 1000),
    disclaimer: str(a.disclaimer, 300),
  };
}

// Egasi talabi: izoh qisqa bo'lsin — ko'pi bilan 3 gap. AI ko'proq yozsa ham, sahifaga 3 tasi chiqadi.
// Gap chegarasi: nuqta/!/? dan keyin bo'shliq va bosh harf ("т.е. может" kabi joylar bo'linmaydi).
const MAX_SENTENCES = 3;
export function firstSentences(text, n = MAX_SENTENCES) {
  const parts = String(text ?? '').trim().split(/(?<=[.!?…])\s+(?=["«(]?[A-ZА-ЯЁЎҚҒҲ])/u);
  return parts.slice(0, n).join(' ');
}
const present = (answer) => ({ ...answer, summary: firstSentences(answer.summary) });

export async function askN8n({ url, token, payload, timeoutMs = 90000 }) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-HPM-Token': token },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) return { error: `n8n ${r.status}${data?.error ? `: ${data.error}` : ''}` };
  const answer = cleanAnswer(data);
  return answer ? { answer } : { error: `n8n: ${data?.error || 'notoʻgʻri javob'}` };
}

export function purgeOldInterpretations() {
  return query(`DELETE FROM interpretations WHERE created_at < now() - interval '${KEEP_DAYS} days'`);
}

const router = Router();

router.post('/results', rateLimit({ windowMs: 60000, max: 20 }), wrap(async (req, res) => {
  const ref = checkRef(req.body?.id, req.body?.key);
  if (!ref) return res.status(400).json({ error: 'bad_link' });
  const page = await fetchLis(ref).catch((err) => {
    console.error('LIS:', err.message);
    return undefined;
  });
  if (page === undefined) return res.status(502).json({ error: 'lis_unavailable' });
  if (!page) {
    track('results:notfound');
    return res.status(404).json({ error: 'not_found' });
  }
  const cfg = await getConfig();
  res.setHeader('Cache-Control', 'no-store');
  // Kvitansiya haqiqiy, natija hali tayyor emas: sahifa buni ochiq aytadi va botga ulanishni taklif qiladi
  if (page.status === 'pending') {
    track('results:pending');
    return res.json({ pending: true, botEnabled: botReady(cfg) });
  }
  track('results:ok');
  const interpretEnabled = cfg['interpret.enabled'] === 'true' && Boolean(cfg['interpret.webhook_url'] && cfg['interpret.token']);
  res.json({ ...page.lab, interpretEnabled, botEnabled: botReady(cfg) });
}));

router.post('/interpret', rateLimit({ windowMs: 10 * 60000, max: 10 }), wrap(async (req, res) => {
  const ref = checkRef(req.body?.id, req.body?.key);
  const sex = req.body?.sex === 'f' ? 'f' : req.body?.sex === 'm' ? 'm' : null;
  const lang = req.body?.lang === 'uz' ? 'uz' : 'ru';
  if (!ref || !sex) return res.status(400).json({ error: 'bad_request' });
  res.setHeader('Cache-Control', 'no-store');

  const cfg = await getConfig();
  if (cfg['interpret.enabled'] !== 'true' || !cfg['interpret.webhook_url'] || !cfg['interpret.token']) {
    return res.status(503).json({ error: 'disabled' });
  }

  const lab = await fetchResults(ref).catch(() => undefined);
  if (lab === undefined) return res.status(502).json({ error: 'lis_unavailable' });
  if (!lab) return res.status(404).json({ error: 'not_found' });
  const results = flat(lab);

  // Xuddi shu natijalar uchun izoh bor bo'lsa, qayta pul sarflamaymiz
  const cached = await query(
    `SELECT answer FROM interpretations
     WHERE lis_id = $1 AND sex = $2 AND lang = $3 AND results = $4::jsonb
     ORDER BY id DESC LIMIT 1`,
    [ref.id, sex, lang, JSON.stringify(results)],
  );
  if (cached.rows[0]) {
    track('ai:cached');
    return res.json({ answer: present(cached.rows[0].answer) });
  }

  if (!underDailyLimit(Number(cfg['interpret.daily_limit']) || 0)) {
    track('ai:limit');
    return res.status(429).json({ error: 'daily_limit' });
  }

  const r = await askN8n({
    url: cfg['interpret.webhook_url'],
    token: cfg['interpret.token'],
    payload: { lang, sex, age: lab.age, results },
  }).catch((err) => ({ error: err.name === 'TimeoutError' ? 'n8n: vaqt tugadi' : `n8n: ${err.message}` }));
  if (r.error) {
    console.error('Interpret:', r.error); // bemor ma'lumoti logga yozilmaydi
    track('ai:error');
    return res.status(502).json({ error: 'ai_unavailable' });
  }
  track('ai:new');

  await query(
    `INSERT INTO interpretations (lis_id, sex, age, lang, specialty, urgency, results, answer)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [ref.id, sex, lab.age, lang, r.answer.specialty, r.answer.urgency, JSON.stringify(results), JSON.stringify(r.answer)],
  );
  res.json({ answer: present(r.answer) });
}));

export default router;
