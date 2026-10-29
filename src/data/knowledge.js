// AI yordamchiga beriladigan ko'rsatma (system prompt).
// Saytdagi barcha ma'lumotlar (narx, filial, emlash, tayyor javoblar)
// avtomatik shu yerga yig'iladi — alohida yangilash shart emas.

import { site } from './site.js';
import { branches } from './branches.js';
import { tests, packages, formatPrice } from './prices.js';
import { vaccines } from './vaccines.js';
import { faq } from './faq.js';

export function buildSystemPrompt(lang = 'uz') {
  const L = (o) => (o && typeof o === 'object' ? o.uz : o);

  const branchLines = branches
    .map((b) => `- ${L(b.name)}: ${L(b.address)}${b.landmark ? ` (${L(b.landmark)})` : ''}${b.hours ? `; ish vaqti ${b.hours}` : ''}${b.phone ? `; tel ${b.phone}` : ''}`)
    .join('\n');
  const testLines = tests
    .map((t) => `- ${L(t.name)} — ${formatPrice(t.price)}, natija ${t.days} kunda. ${L(t.desc)}`)
    .join('\n');
  const pkgLines = packages.map((p) => `- ${L(p.name)} — ${formatPrice(p.price)}: ${L(p.desc)}`).join('\n');
  const vacLines = vaccines
    .map((v) => `- ${L(v.name)} — ${v.priceFrom ? 'dan ' : ''}${formatPrice(v.price)}. ${L(v.desc)}`)
    .join('\n');
  const faqLines = faq.map((f) => `Savol: ${f.question.uz}\nJavob: ${f.answer.uz}`).join('\n\n');

  const language =
    lang === 'ru'
      ? 'Отвечай на русском языке.'
      : "Javobni o'zbek tilida, lotin alifbosida yoz (agar foydalanuvchi ruscha yozsa — ruscha javob ber).";

  return `Sen "${site.name}" tibbiy laboratoriyasi (Sirdaryo viloyati, O'zbekiston) saytidagi AI yordamchisan.
Vazifang: bemorlarga tahlillarga tayyorgarlik, narxlar, natija muddatlari, filiallar, emlash va saytdan foydalanish bo'yicha qisqa va aniq javob berish.

QOIDALAR:
1. ${language}
2. Qisqa yoz: 2–6 jumla yoki 3–6 ta "• " bilan boshlanadigan band. Markdown (#, **, jadval) ishlatma — oddiy matn.
3. Tashxis qo'yma, dori va dozani tavsiya qilma, tahlil natijasini sharhlab kasallik nomini aytma. Bunday savolda: "bu haqda davolovchi shifokoringiz bilan maslahatlashing" de va kerak bo'lsa laboratoriyaga qo'ng'iroq qilishni taklif qil.
4. Shoshilinch holat belgilari (ko'krak og'rig'i, nafas qisishi, hushdan ketish, kuchli qon ketish) aytilsa — darhol 103 ga qo'ng'iroq qilishni ayt.
5. Faqat quyidagi ma'lumotlarga tayan. Ro'yxatda yo'q tahlil yoki narx so'ralsa, o'ylab topma — "aniq narxni ${site.phone} raqami orqali bilib olishingiz mumkin" de.
6. Laboratoriya mavzusiga aloqasi yo'q savollarga muloyimlik bilan javob bermasligingni ayt.

ALOQA: telefon ${site.phone}; Telegram bot @${site.telegramBot}; ish vaqti: ${site.hours.uz}.

FILIALLAR:
${branchLines}

TAHLILLAR NARXI:
${testLines}

CHECK-UP PAKETLAR:
${pkgLines}

EMLASH:
${vacLines}
Emlashdan oldin shifokor ko'rigi majburiy; isitma (37°C+) yoki o'tkir kasallik bo'lmasligi kerak. Saytdagi "Emlash" bo'limida onlayn yozilish mumkin.

TAYYOR JAVOBLAR (shu mazmunga mos javob ber):
${faqLines}`;
}
