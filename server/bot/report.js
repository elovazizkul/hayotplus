// "Shifokorga ko'rsatish": bitta profil, tanlangan ko'rsatkichlar va davr bo'yicha grafiklar + jadval (HTML → PDF).
// FIO yo'q (bizda yo'q): profil nomi, jinsi, tug'ilgan yili. Grafik — Mini App'dagi bilan bir xil mantiq (SVG).

import { query } from '../db.js';
import { parseRefForSex } from './values.js';
import { profileName } from './texts.js';
import { avatarOf, avatarUrl, colorOf, isImageAvatar } from '../../src/data/avatars.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDay = (d) => (d ? d.split('-').reverse().join('.') : '');
const nice = (v) => {
  const a = Math.abs(v);
  return a >= 100 ? Math.round(v) : a >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
};

const L = {
  title: { uz: 'Tahlillar dinamikasi', ru: 'Динамика анализов' },
  sex: { uz: 'Jinsi', ru: 'Пол' },
  m: { uz: 'erkak', ru: 'мужской' },
  f: { uz: 'ayol', ru: 'женский' },
  born: { uz: 'Tugʻilgan yili', ru: 'Год рождения' },
  period: { uz: 'Davr', ru: 'Период' },
  all: { uz: 'butun davr', ru: 'всё время' },
  months: { uz: 'oxirgi {n} oy', ru: 'последние {n} мес.' },
  made: { uz: 'Tuzilgan sana', ru: 'Дата составления' },
  date: { uz: 'Sana', ru: 'Дата' },
  value: { uz: 'Natija', ru: 'Результат' },
  ref: { uz: 'Meʼyor', ru: 'Норма' },
  norm: { uz: 'yashil — meʼyor', ru: 'зелёное — норма' },
  target: { uz: 'punktir — shaxsiy maqsad', ru: 'пунктир — личная цель' },
  note: {
    uz: 'SINOV REJIMI. Hayot Plus laboratoriyasi natijalari asosida avtomatik tuzilgan va xato yoki nomuvofiqlik boʻlishi mumkin. Tibbiy hujjat emas. Rasmiy natija — laboratoriya bergan asl blank (imzo va muhr bilan); farq boʻlsa, asl blank toʻgʻri hisoblanadi. Xulosani shifokor chiqaradi.',
    ru: 'ТЕСТОВЫЙ РЕЖИМ. Составлено автоматически по результатам лаборатории Hayot Plus и может содержать ошибки или несовпадения. Не является медицинским документом. Официальный результат — оригинальный бланк лаборатории (с подписью и печатью); при расхождении верным считается оригинал. Заключение делает врач.',
  },
};
const l = (k, lang, n) => L[k][lang === 'ru' ? 'ru' : 'uz'].replace('{n}', n);

// Grafik: yashil polosa — oxirgi tahlildagi me'yor, to'q sariq punktir — shaxsiy maqsad, qizil nuqta — me'yordan tashqari
export function chartSvg(points, target) {
  const W = 520;
  const H = 170;
  const P = { l: 44, r: 16, t: 14, b: 26 };
  const pts = points.filter((p) => typeof p.num === 'number');
  if (!pts.length) return '';
  const last = pts[pts.length - 1];
  const edges = [last.low, last.high, target?.low, target?.high].filter((v) => typeof v === 'number');
  const vals = pts.map((p) => p.num);
  let min = Math.min(...vals, ...edges);
  let max = Math.max(...vals, ...edges);
  if (last.low === null && last.high !== null) min = Math.min(min, 0);
  if (min === max) {
    min -= Math.abs(min) * 0.2 || 1;
    max += Math.abs(max) * 0.2 || 1;
  }
  const span = max - min;
  min -= span * 0.12;
  max += span * 0.12;
  if (vals.every((v) => v >= 0) && edges.every((v) => v >= 0)) min = Math.max(min, 0);
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const x = (i) => P.l + (pts.length === 1 ? iw / 2 : (i * iw) / (pts.length - 1));
  const y = (v) => P.t + ih - ((v - min) / (max - min)) * ih;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`];
  if (last.low !== null || last.high !== null) {
    const top = last.high !== null ? y(last.high) : P.t;
    const bottom = last.low !== null ? y(last.low) : P.t + ih;
    out.push(`<rect x="${P.l}" y="${top}" width="${iw}" height="${Math.max(bottom - top, 1)}" fill="#d7f3ee"/>`);
  }
  for (const v of [min + (max - min) * 0.1, (min + max) / 2, max - (max - min) * 0.1]) {
    out.push(`<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f5"/><text x="${P.l - 6}" y="${y(v) + 3}" font-size="10" text-anchor="end" fill="#5f6b78">${nice(v)}</text>`);
  }
  for (const v of [target?.low, target?.high].filter((t) => typeof t === 'number')) {
    out.push(`<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e08a00" stroke-width="1.5" stroke-dasharray="6 4"/>`);
  }
  if (pts.length > 1) out.push(`<polyline points="${pts.map((p, i) => `${x(i)},${y(p.num)}`).join(' ')}" fill="none" stroke="#0f8a8a" stroke-width="2"/>`);
  const every = Math.ceil(pts.length / 6);
  pts.forEach((p, i) => {
    out.push(`<circle cx="${x(i)}" cy="${y(p.num)}" r="4" fill="${p.flag ? '#ba1a1a' : '#0f8a8a'}" stroke="#fff" stroke-width="1.5"/>`);
    const anchor = pts.length === 1 ? 'middle' : i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle';
    if (i % every === 0 || i === pts.length - 1) out.push(`<text x="${x(i)}" y="${H - 8}" font-size="10" text-anchor="${anchor}" fill="#5f6b78">${fmtDay(p.day)}</text>`);
  });
  out.push('</svg>');
  return out.join('');
}

export async function buildReport({ telegramId, pid, aids, months, lang, siteBase }) {
  const { rows: [p] } = await query(
    'SELECT id, relation, label, birth_year, sex, avatar, color FROM bot_patients WHERE id = $1 AND telegram_id = $2',
    [pid, telegramId],
  );
  if (!p) return null;
  const params = [telegramId, pid, aids];
  const since = months > 0 ? `AND coalesce(r.measured_on, (o.created_at AT TIME ZONE 'Asia/Tashkent')::date) >= current_date - make_interval(months => $4)` : '';
  if (months > 0) params.push(months);
  const { rows } = await query(
    `SELECT c.id AS aid, c.lis_name, c.name_uz, c.name_ru, c.unit AS c_unit,
            to_char(coalesce(r.measured_on, (o.created_at AT TIME ZONE 'Asia/Tashkent')::date), 'YYYY-MM-DD') AS day,
            r.value_text, r.value_num::float8 AS value_num, r.unit, r.ref_text, r.ref_low::float8 AS ref_low, r.ref_high::float8 AS ref_high
     FROM lab_results r
     JOIN bot_orders o ON o.id = r.order_id
     JOIN lab_analytes a ON a.id = r.analyte_id
     JOIN lab_analytes c ON c.id = coalesce(nullif(a.merged_into, 0), a.id)
     WHERE o.telegram_id = $1 AND o.patient_id = $2 AND c.id = ANY($3::bigint[]) ${since}
     ORDER BY day, r.id`,
    params,
  );
  if (!rows.length) return { profile: p, empty: true };
  const { rows: tg } = await query(
    'SELECT analyte_id, low::float8 AS low, high::float8 AS high FROM patient_targets WHERE patient_id = $1',
    [pid],
  );
  const targets = new Map(tg.map((t) => [Number(t.analyte_id), t]));

  const byAid = new Map();
  for (const r of rows) {
    const aid = Number(r.aid);
    if (!byAid.has(aid)) {
      const name = (lang === 'ru' ? r.name_ru || r.name_uz : r.name_uz) || r.lis_name;
      byAid.set(aid, { aid, name, unit: r.c_unit || r.unit, points: [] });
    }
    const ref = r.ref_low === null && r.ref_high === null ? parseRefForSex(r.ref_text, p.sex) : { low: r.ref_low, high: r.ref_high };
    const num = r.value_num;
    const flag = num !== null && ((ref.low !== null && num < ref.low) || (ref.high !== null && num > ref.high));
    byAid.get(aid).points.push({ day: r.day, text: r.value_text, num, ref: r.ref_text, low: ref.low, high: ref.high, flag });
  }
  const list = aids.map(Number).map((a) => byAid.get(a)).filter(Boolean);
  return { profile: p, html: reportHtml({ p, list, targets, months, lang, siteBase }), count: list.length };
}

// Sof HTML (bazasiz) — alohida sinash mumkin
export function reportHtml({ p, list, targets, months, lang, siteBase }) {
  const av = avatarOf(p);
  const avatar = isImageAvatar(av)
    ? `<img src="${siteBase}${avatarUrl(av)}" style="width:54px;height:54px;border-radius:50%;background:${colorOf(p).bg}">`
    : '';
  const who = esc(profileName(p, lang));
  const today = new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' });

  const sections = list.map((a) => {
    const t = targets.get(a.aid);
    const targetText = t ? ` · ${l('target', lang)}: ${[t.low !== null ? `≥ ${t.low}` : '', t.high !== null ? `≤ ${t.high}` : ''].filter(Boolean).join(', ')}` : '';
    const rowsHtml = [...a.points].reverse().map((pt) =>
      `<tr><td>${fmtDay(pt.day)}</td><td class="v${pt.flag ? ' bad' : ''}">${esc(pt.text)}${pt.flag ? (pt.num > (pt.high ?? Infinity) ? ' ↑' : ' ↓') : ''}</td><td class="r">${esc(pt.ref)}</td></tr>`).join('');
    return `<section><h3>${esc(a.name)}${a.unit ? ` <span>${esc(a.unit)}</span>` : ''}</h3>
      ${chartSvg(a.points, t)}
      <p class="legend">${l('norm', lang)}${targetText}</p>
      <table><thead><tr><th>${l('date', lang)}</th><th>${l('value', lang)}</th><th>${l('ref', lang)}</th></tr></thead><tbody>${rowsHtml}</tbody></table></section>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:12mm}
    body{font-family:'Noto Sans','DejaVu Sans',Arial,sans-serif;color:#131b2e;font-size:11.5px;margin:0}
    header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f8a8a;padding-bottom:8px;margin-bottom:10px}
    .brand{display:flex;align-items:center;gap:10px}.brand img{width:44px;height:44px}
    .brand b{font-size:18px;color:#0f8a8a;display:block}.brand small{color:#5f6b78;font-size:12px}
    .who{display:flex;align-items:center;gap:10px;text-align:right}.who b{font-size:15px}
    .meta{color:#5f6b78;font-size:11px}
    section{break-inside:avoid;border:1px solid #e2e8f5;border-radius:10px;padding:8px 12px;margin:0 0 10px}
    h3{margin:0 0 4px;font-size:14px;color:#0f8a8a}h3 span{color:#5f6b78;font-weight:normal;font-size:11px}
    .legend{margin:2px 0 6px;color:#5f6b78;font-size:10px}
    table{width:100%;border-collapse:collapse}th{text-align:left;color:#5f6b78;font-weight:normal;font-size:10px;border-bottom:1px solid #e2e8f5}
    td{padding:3px 0;border-bottom:1px solid #f0f3fa}td.v{font-weight:bold;color:#006c49}td.bad{color:#ba1a1a}td.r{color:#5f6b78;font-size:10.5px}
    footer{margin-top:8px;color:#5f6b78;font-size:10px;border-top:1px solid #e2e8f5;padding-top:6px}
  </style></head><body>
    <header>
      <div class="brand"><img src="${siteBase}/logo-192.png"><div><b>Hayot Plus</b><small>${l('title', lang)}</small></div></div>
      <div class="who"><div><b>${who}</b><div class="meta">${p.sex ? `${l('sex', lang)}: ${l(p.sex, lang)} · ` : ''}${p.birth_year ? `${l('born', lang)}: ${p.birth_year}` : ''}</div>
        <div class="meta">${l('period', lang)}: ${months ? l('months', lang, months) : l('all', lang)} · ${l('made', lang)}: ${today}</div></div>${avatar}</div>
    </header>
    ${sections}
    <footer>${l('note', lang)} · ${esc(siteBase.replace(/^https?:\/\//, ''))}</footer>
  </body></html>`;
}
