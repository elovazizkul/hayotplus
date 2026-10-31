// Saytda ko'rinadigan barcha ma'lumotni bazadan yig'adi. Natija xotirada
// turadi va har bir o'zgarishdan keyin yangilanadi, shu sabab sayt tez ishlaydi.

import { query } from './db.js';
import { site as siteDefaults } from '../src/data/site.js';
import { applyContent } from '../src/data/hydrate.js';

const i18n = (r, k) => ({ uz: r[`${k}_uz`], ru: r[`${k}_ru`] || r[`${k}_uz`] });
const optional = (r, k) => (r[`${k}_uz`] ? i18n(r, k) : undefined);

const rows = async (table) =>
  (await query(`SELECT * FROM ${table} WHERE active ORDER BY sort_order, id`)).rows;

function buildSite(map, base) {
  const out = { ...base };
  for (const [key, value] of map) {
    if (!key.startsWith('site.')) continue;
    const parts = key.split('.').slice(1);
    if (parts.length === 1) out[parts[0]] = value;
    else out[parts[0]] = { ...out[parts[0]], [parts[1]]: value };
  }
  return out;
}

let cached = null;
const baseSite = { ...siteDefaults };

export async function refreshContent() {
  const [categories, tests, packages, vaccines, rules, branches, faq, settings] = await Promise.all([
    rows('categories'),
    rows('tests'),
    rows('packages'),
    rows('vaccines'),
    rows('vaccine_rules'),
    rows('branches'),
    rows('faq'),
    query(`SELECT key, value FROM settings WHERE key LIKE 'site.%'`),
  ]);

  const content = {
    categories: categories.map((c) => ({ id: c.id, label: i18n(c, 'label') })),
    tests: tests.map((t) => ({
      id: t.id,
      category: t.category_id,
      name: i18n(t, 'name'),
      desc: i18n(t, 'desc'),
      sample: i18n(t, 'sample'),
      accent: t.accent || undefined,
      days: t.days,
      price: t.price,
      keywords: t.keywords,
    })),
    packages: packages.map((p) => ({
      id: p.id,
      icon: p.icon,
      iconColor: p.icon_color,
      badge: i18n(p, 'badge'),
      badgeStyle: p.badge_style,
      name: i18n(p, 'name'),
      desc: i18n(p, 'desc'),
      price: p.price,
    })),
    vaccines: vaccines.map((v) => ({
      id: v.id,
      icon: v.icon,
      iconColor: v.icon_color,
      tag: i18n(v, 'tag'),
      name: i18n(v, 'name'),
      desc: i18n(v, 'desc'),
      price: v.price,
      priceFrom: v.price_from,
      note: i18n(v, 'note'),
    })),
    vaccineRules: rules.map((r) => ({ title: i18n(r, 'title'), text: i18n(r, 'text') })),
    branches: branches.map((b) => ({
      id: b.id,
      main: b.is_main,
      icon: b.icon,
      name: i18n(b, 'name'),
      short: i18n(b, 'short'),
      city: i18n(b, 'city'),
      address: i18n(b, 'address'),
      landmark: optional(b, 'landmark'),
      hours: b.hours,
      phone: b.phone,
      lat: b.lat,
      lng: b.lng,
    })),
    faq: faq.map((f) => ({
      id: f.id,
      question: i18n(f, 'question'),
      keywords: f.keywords,
      answer: i18n(f, 'answer'),
    })),
    site: buildSite(new Map(settings.rows.map((s) => [s.key, s.value])), baseSite),
  };

  applyContent(content); // AI bilim bazasi ham yangilansin
  cached = content;
  return content;
}

export const currentContent = () => cached;
