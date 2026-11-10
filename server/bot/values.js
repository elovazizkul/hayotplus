// Blankdagi qiymat va me'yorni raqamga aylantirish (grafik uchun). Shubhali bo'lsa — raqam yo'q, faqat matn:
// grafikda noto'g'ri nuqtadan ko'ra nuqtasiz yaxshiroq.

const NUM = String.raw`-?\d+(?:[.,]\d+)?`;
const toNum = (s) => Number(String(s).replace(',', '.'));
const squash = (s) => String(s ?? '').replace(/ /g, ' ').replace(/(\d)\s+(?=\d{3}\b)/g, '$1').trim();

// "18,6" → 18.6; "1 200" → 1200; "<0.5", "manfiy", "5.4 ↑" → null (matn sifatida saqlanadi)
export function parseValue(text) {
  const s = squash(text);
  return new RegExp(`^${NUM}$`).test(s) ? toNum(s) : null;
}

// "3.9-6.1", "3,9 – 6,1" → {low, high}; "< 42", "до 42" → {high}; "> 5", "от 5" → {low}.
// Jinsga yoki yoshga qarab har xil me'yor ("Муж < 42 Жен < 32") — raqamsiz (4-bosqichda profil jinsi bo'yicha).
export function parseRef(text) {
  const s = squash(text).toLowerCase();
  const none = { low: null, high: null };
  if (!s || /муж|жен|male|female|erkak|ayol|дет|лет|yosh|bola/.test(s)) return none;
  let m = s.match(new RegExp(`^(${NUM})\\s*(?:-|–|—|\\.\\.\\.?)\\s*(${NUM})$`));
  if (m) {
    const [low, high] = [toNum(m[1]), toNum(m[2])];
    return low <= high ? { low, high } : none;
  }
  m = s.match(new RegExp(`^(?:<|≤|<=|до|gacha)\\s*(${NUM})$`));
  if (m) return { low: null, high: toNum(m[1]) };
  m = s.match(new RegExp(`^(?:>|≥|>=|от|dan)\\s*(${NUM})$`));
  if (m) return { low: toNum(m[1]), high: null };
  return none;
}

// "09.11.2026" → "2026-11-09"
export function isoDate(ddmmyyyy) {
  const m = String(ddmmyyyy ?? '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
