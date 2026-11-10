// Laboratoriya dasturi (ToDevelop) sahifasidan tahlil natijalarini o'qish.
// QR-koddagi havola: https://hy.todevelop.ru/q/r/result?id=165134&tmpK=...
// Faqat shu manzilga so'rov yuboriladi — boshqa saytlarni ochib bo'lmaydi.

export const LIS_HOST = 'hy.todevelop.ru';

export function checkRef(id, key) {
  const ref = { id: String(id ?? '').trim(), key: String(key ?? '').trim() };
  if (!/^\d{1,12}$/.test(ref.id) || !/^[A-Za-z0-9_-]{20,300}$/.test(ref.key)) return null;
  return ref;
}

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const rowsOf = (tableHtml) =>
  [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<t([dh])\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => ({ th: c[1].toLowerCase() === 'h', text: decode(c[2]) })),
  );

// Bemor ismi va shifokor ismi olinmaydi: faqat blank raqami, sana, tug'ilgan yil va natijalar
export function parseResultsHtml(html) {
  const info = {};
  const infoTable = html.match(/<table\b[^>]*table-information[^>]*>([\s\S]*?)<\/table>/i);
  if (infoTable) {
    for (const r of rowsOf(infoTable[1])) if (r.length >= 2) info[r[0].text.toLowerCase()] = r[1].text;
  }

  const groups = [];
  let title = '';
  for (const m of html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>|<table\b[^>]*table-main[^>]*>([\s\S]*?)<\/table>/gi)) {
    if (m[1] !== undefined) {
      title = decode(m[1]).slice(0, 120);
      continue;
    }
    const items = rowsOf(m[2])
      .filter((r) => r.length >= 2 && !r.some((c) => c.th))
      .map((r) => ({ name: r[0].text, value: r[1].text, unit: r[2]?.text || '', ref: r[3]?.text || '' }))
      .filter((x) => x.name && x.value)
      .map((x) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v.slice(0, 200)])));
    if (items.length) groups.push({ title, items: items.slice(0, 200) });
  }

  const date = (info['дата анализов'] || '').match(/\d{2}\.\d{2}\.\d{4}/)?.[0] || '';
  const birthYear = Number((info['год рождения'] || '').match(/\b(19|20)\d{2}\b/)?.[0]) || null;
  const testYear = Number(date.slice(6)) || new Date().getFullYear();
  const number = (html.match(/(?:№|&#8470;)\s*(?:<[^>]+>\s*)*(\d{3,})/)?.[1] || '').replace(/^0+/, '');

  return {
    number,
    date,
    age: birthYear && testYear >= birthYear ? testYear - birthYear : null,
    birthYear, // faqat bot uchun (profilni taxmin qilish); saytga yuborilmaydi
    groups: groups.slice(0, 50),
  };
}

export const lisUrl = (ref) => `https://${LIS_HOST}/q/r/result?id=${ref.id}&tmpK=${encodeURIComponent(ref.key)}`;

// Natija hali tayyor bo'lmasa, sahifada: "Hurmatli <ISM>, analiz natijalari xali tayyor emas. Iltimos kutib turing."
// Sahifadan hech narsa olinmaydi (unda bemor ismi bor) — faqat "tayyor emas" ekani.
export const isPendingPage = (html) => /tayyor\s+emas|(?:ещё|еще)\s+не\s+готов/i.test(html);

// { status: 'ready', lab, html } — natija tayyor
// { status: 'pending' }          — kvitansiya haqiqiy, lekin natija hali tayyor emas
// null                            — havola noto'g'ri yoki eskirgan (laboratoriya dasturi rad etdi)
// Xato (throw)                    — laboratoriya dasturi javob bermadi
export async function fetchLis(ref) {
  const r = await fetch(lisUrl(ref), {
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    headers: { 'user-agent': 'HayotPlus-site/1.0', accept: 'text/html' },
  });
  if (r.status === 403 || r.status === 404) return null;
  if (!r.ok) throw new Error(`Laboratoriya dasturi javob bermadi: ${r.status}`);
  const html = (await r.text()).slice(0, 2_000_000);
  const lab = parseResultsHtml(html);
  if (lab.groups.length) return { status: 'ready', lab, html };
  return isPendingPage(html) ? { status: 'pending' } : null;
}

// Faqat tayyor natijalar (AI izohi uchun): null — topilmadi yoki hali tayyor emas
export async function fetchResults(ref) {
  const page = await fetchLis(ref);
  return page?.status === 'ready' ? page.lab : null;
}
