// Birinchi ishga tushishda bazani src/data/* dagi mavjud ma'lumotlar bilan to'ldiradi.
// Keyinchalik baza asosiy manba: bu fayllar qayta o'qilmaydi.

import { tx } from './db.js';
import { getRaw, setRaw } from './settings.js';
import { hashPassword } from './security.js';
import { site } from '../src/data/site.js';
import { branches } from '../src/data/branches.js';
import { categories, tests, packages } from '../src/data/prices.js';
import { vaccines, vaccineRules } from '../src/data/vaccines.js';
import { faq } from '../src/data/faq.js';

const insert = (c, table, row) => {
  const cols = Object.keys(row);
  return c.query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
    Object.values(row),
  );
};

const pair = (name, v) => ({ [`${name}_uz`]: v?.uz ?? '', [`${name}_ru`]: v?.ru ?? '' });

const siteValues = () => ({
  'site.name': site.name,
  'site.url': site.url,
  'site.phone': site.phone,
  'site.phone2': site.phone2,
  'site.telegramBot': site.telegramBot,
  'site.telegramChannel': site.telegramChannel,
  'site.instagram': site.instagram,
  'site.hours.uz': site.hours.uz,
  'site.hours.ru': site.hours.ru,
  'site.hoursNote.uz': site.hoursNote.uz,
  'site.hoursNote.ru': site.hoursNote.ru,
  'site.heroTagline.uz': site.heroTagline.uz,
  'site.heroTagline.ru': site.heroTagline.ru,
  'site.heroImage': site.heroImage,
  'site.licenseNumber': site.licenseNumber,
});

export async function seed() {
  if (await getRaw('meta.seeded')) return;
  await tx(async (c) => {
    let i = 0;
    for (const cat of categories.filter((x) => x.id !== 'all')) {
      await insert(c, 'categories', { id: cat.id, ...pair('label', cat.label), sort_order: (i += 10) });
    }
    i = 0;
    for (const t of tests) {
      await insert(c, 'tests', {
        id: t.id,
        category_id: t.category,
        ...pair('name', t.name),
        ...pair('desc', t.desc),
        ...pair('sample', t.sample),
        days: t.days,
        price: t.price,
        keywords: t.keywords ?? '',
        accent: t.accent ?? '',
        sort_order: (i += 10),
      });
    }
    i = 0;
    for (const p of packages) {
      await insert(c, 'packages', {
        id: p.id,
        icon: p.icon,
        icon_color: p.iconColor,
        ...pair('badge', p.badge),
        badge_style: p.badgeStyle,
        ...pair('name', p.name),
        ...pair('desc', p.desc),
        price: p.price,
        sort_order: (i += 10),
      });
    }
    i = 0;
    for (const v of vaccines) {
      await insert(c, 'vaccines', {
        id: v.id,
        icon: v.icon,
        icon_color: v.iconColor,
        ...pair('tag', v.tag),
        ...pair('name', v.name),
        ...pair('desc', v.desc),
        ...pair('note', v.note),
        price: v.price,
        price_from: Boolean(v.priceFrom),
        sort_order: (i += 10),
      });
    }
    i = 0;
    for (const r of vaccineRules) {
      await insert(c, 'vaccine_rules', { id: `rule-${i / 10 + 1}`, ...pair('title', r.title), ...pair('text', r.text), sort_order: (i += 10) });
    }
    i = 0;
    for (const b of branches) {
      await insert(c, 'branches', {
        id: b.id,
        is_main: Boolean(b.main),
        icon: b.icon,
        ...pair('name', b.name),
        ...pair('short', b.short),
        ...pair('city', b.city),
        ...pair('address', b.address),
        ...pair('landmark', b.landmark),
        hours: b.hours,
        phone: b.phone,
        lat: b.lat,
        lng: b.lng,
        sort_order: (i += 10),
      });
    }
    i = 0;
    for (const f of faq) {
      await insert(c, 'faq', { id: f.id, ...pair('question', f.question), ...pair('answer', f.answer), keywords: f.keywords, sort_order: (i += 10) });
    }
    for (const [key, value] of Object.entries(siteValues())) await setRaw(key, value ?? '', c);
    await setRaw('meta.seeded', '1', c);
  });
  console.log('Baza boshlangʻich maʼlumotlar bilan toʻldirildi');
}

// Birinchi admin parolini .env dagi ADMIN_PASSWORD dan oladi
export async function ensureAdmin() {
  if (await getRaw('admin.password_hash')) return;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) throw new Error('ADMIN_PASSWORD kamida 10 belgi boʻlishi kerak');
  await setRaw('admin.password_hash', await hashPassword(password));
}
