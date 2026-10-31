// Bazadagi ma'lumotlarni fayllardagi ro'yxatlar ustiga qo'yadi.
// Komponentlar va AI bilim bazasi shu ro'yxatlardan o'qiydi, shuning uchun
// ularni o'zgartirish shart emas. Baza bo'lmasa — fayldagi qiymatlar ishlaydi.

import { site } from './site.js';
import { branches } from './branches.js';
import { categories, tests, packages } from './prices.js';
import { vaccines, vaccineRules } from './vaccines.js';
import { faq } from './faq.js';

const replace = (target, items) => {
  if (Array.isArray(items)) target.splice(0, target.length, ...items);
};

export function applyContent(content) {
  if (!content) return;
  const all = categories.find((c) => c.id === 'all');
  if (content.categories) replace(categories, [all, ...content.categories]);
  replace(tests, content.tests);
  replace(packages, content.packages);
  replace(vaccines, content.vaccines);
  replace(vaccineRules, content.vaccineRules);
  replace(branches, content.branches);
  replace(faq, content.faq);
  if (content.site) Object.assign(site, content.site);
}
