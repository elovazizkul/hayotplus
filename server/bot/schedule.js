// Avtomatik tekshirish jadvali (2-bosqich). Bazasiz, sof hisob-kitob — alohida sinash oson.
// Barcha raqamlar admin panel → "Natijalar boti" dan keladi, noto'g'ri qiymat bo'lsa — xavfsiz chegaralar.

import { createHash } from 'node:crypto';

const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;

// Yetkazilgandan keyin natija o'zgarmadimi (qisman natija to'ldirildimi) — shuncha kun, har shuncha soatda
export const WATCH_DAYS = 14;
export const WATCH_HOURS = 6;

const int = (v, def, min, max) => {
  const n = Number.parseInt(v, 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : def, min), max);
};

export function scheduleConfig(cfg = {}) {
  const maxDays = int(cfg['bot.max_days'], 30, 1, 90);
  return {
    fastDays: int(cfg['bot.fast_days'], 2, 0, maxDays),
    fastMinutes: int(cfg['bot.fast_minutes'], 30, 10, 24 * 60),
    slowHours: int(cfg['bot.slow_hours'], 4, 1, 48),
    operatorDays: int(cfg['bot.operator_days'], 7, 1, maxDays),
    maxDays,
    quietFrom: int(cfg['bot.quiet_from'], 22, 0, 23),
    quietTo: int(cfg['bot.quiet_to'], 7, 0, 23),
  };
}

// Toshkent vaqti bo'yicha soat (0–23)
export const tashkentHour = (now = new Date()) =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', hour: 'numeric', hourCycle: 'h23' }).format(now));

// Tungi tinchlik: 22 → 7 kabi tun yarmidan o'tadigan oraliq ham ishlaydi. from == to — tinchlik yo'q.
export function isQuiet(s, now = new Date()) {
  const h = tashkentHour(now);
  if (s.quietFrom === s.quietTo) return false;
  return s.quietFrom > s.quietTo ? h >= s.quietFrom || h < s.quietTo : h >= s.quietFrom && h < s.quietTo;
}

export const ageDays = (since, now = new Date()) => (now - new Date(since)) / DAY;

// Hali tayyor bo'lmagan blank: keyingi tekshiruv vaqti yoki null (muddat tugadi)
export function nextPendingCheck(createdAt, s, now = new Date()) {
  const age = ageDays(createdAt, now);
  if (age >= s.maxDays) return null;
  return new Date(now.getTime() + (age < s.fastDays ? s.fastMinutes * MIN : s.slowHours * HOUR));
}

// Yuborilgan blank: natija o'zgarmadimi — keyingi tekshiruv yoki null (kuzatish tugadi)
export function nextWatchCheck(deliveredAt, now = new Date()) {
  const next = new Date(now.getTime() + WATCH_HOURS * HOUR);
  return next - new Date(deliveredAt) <= WATCH_DAYS * DAY ? next : null;
}

// Natijalar izi: nomlar, qiymatlar, birlik va me'yorlar bo'yicha. Izdan raqamlarni tiklab bo'lmaydi.
export function resultHash(lab) {
  const rows = lab.groups.flatMap((g) => g.items.map((x) => [g.title, x.name, x.value, x.unit, x.ref]));
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 32);
}
