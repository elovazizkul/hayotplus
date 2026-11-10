// Profil avatarlari va ranglari (Mini App, bot). Server ham shu ro'yxat bilan tekshiradi.
// Ikki xil: chizilgan rasmlar (public/avatars/*.svg, scripts/gen-avatars.mjs) va emoji.
// Surat yuklash yo'q: odamlar suratini saqlash — qo'shimcha shaxsiy ma'lumot.
import { AVATAR_IMAGES } from './avatar-images.js';

export { AVATAR_IMAGES };
export const AVATARS = ['👨', '👩', '🧔', '🧕', '👴', '👵', '👦', '👧', '👶', '🧒', '👱‍♂️', '👱‍♀️', '🧑', '👳', '🙂', '❤️'];
const IMAGE_IDS = new Set(AVATAR_IMAGES.map((a) => a.id));
export const ALL_AVATARS = [...AVATAR_IMAGES.map((a) => a.id), ...AVATARS];

export const isImageAvatar = (a) => IMAGE_IDS.has(a);
export const avatarUrl = (id) => `/avatars/${id}.svg`;

// Har bir rang: och fon, matn, tungi rejim foni
export const AVATAR_COLORS = {
  blue: { bg: '#d3ebff', fg: '#00628e', dark: '#0b3550' },
  green: { bg: '#d6fbe9', fg: '#006c49', dark: '#003824' },
  amber: { bg: '#ffe7b8', fg: '#7a5200', dark: '#4a3300' },
  pink: { bg: '#ffd9e6', fg: '#99254f', dark: '#5c1530' },
  violet: { bg: '#e6ddff', fg: '#4f3aa8', dark: '#2c2160' },
  teal: { bg: '#c9f3f0', fg: '#00686a', dark: '#003b3d' },
};

// Tanlanmagan bo'lsa — kimligi va jinsi bo'yicha (emoji: bot uchun)
export function defaultEmoji(p = {}) {
  const f = p.sex === 'f';
  switch (p.relation) {
    case 'father': return '👴';
    case 'mother': return '👵';
    case 'child': return p.sex === 'm' ? '👦' : f ? '👧' : '🧒';
    case 'spouse':
    case 'self': return f ? '👩' : p.sex === 'm' ? '👨' : '🧑';
    default: return '🙂';
  }
}

// Mini App uchun: chizilgan rasm (jinsi noma'lum bo'lsa — emoji)
function defaultImage(p = {}) {
  const m = p.sex === 'm';
  const f = p.sex === 'f';
  switch (p.relation) {
    case 'father': return 'c-grandpa';
    case 'mother': return 'c-grandma';
    case 'child': return m ? 'c-boy' : f ? 'c-girl' : null;
    case 'spouse': return m ? 'c-man2' : f ? 'c-woman2' : null;
    case 'self': return m ? 'c-man1' : f ? 'c-woman1' : null;
    default: return null;
  }
}

const COLOR_BY_RELATION = { self: 'blue', father: 'teal', mother: 'pink', child: 'amber', spouse: 'violet', other: 'green' };
export const defaultColor = (p = {}) => COLOR_BY_RELATION[p.relation] || 'blue';

// Profil avatari: tanlangani yoki standart (rasm id yoki emoji)
export const avatarOf = (p) => (ALL_AVATARS.includes(p?.avatar) ? p.avatar : defaultImage(p) || defaultEmoji(p));
// Bot xabarlari uchun — faqat emoji
export const avatarEmoji = (p) => (AVATARS.includes(p?.avatar) ? p.avatar : defaultEmoji(p));
export const colorOf = (p) => AVATAR_COLORS[p?.color] || AVATAR_COLORS[defaultColor(p)];
