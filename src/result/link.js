// QR-koddagi havoladan blank raqami (id) va kalitni (tmpK) ajratib oladi.
// Qabul qilinadi: laboratoriya dasturi havolasi va saytning o'z /natija havolasi.

const LIS_HOST = 'hy.todevelop.ru';

export function checkRef(id, key) {
  const ref = { id: String(id ?? '').trim(), key: String(key ?? '').trim() };
  return /^\d{1,12}$/.test(ref.id) && /^[A-Za-z0-9_-]{20,300}$/.test(ref.key) ? ref : null;
}

export function parseResultLink(text) {
  let u;
  try {
    u = new URL(String(text).trim());
  } catch {
    return null;
  }
  const lis = u.hostname === LIS_HOST && u.pathname === '/q/r/result';
  const own = (u.hostname === window.location.hostname || /(^|\.)hayotplus\.uz$/.test(u.hostname)) && u.pathname.replace(/\/$/, '') === '/natija';
  return lis || own ? checkRef(u.searchParams.get('id'), u.searchParams.get('tmpK')) : null;
}

export const refFromLocation = () => {
  const p = new URLSearchParams(window.location.search);
  return checkRef(p.get('id'), p.get('tmpK'));
};
