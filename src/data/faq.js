// ============================================================
//  AI YORDAMCHI — tayyor javoblar (shablonlar)
// ============================================================
//  Bu javoblar AI'siz, darhol chiqadi (pul sarflanmaydi):
//   • tezkor savol tugmalari bosilganda;
//   • AI ulanmagan yoki ishlamay qolganda — kalit so'zlar orqali.
//  Bundan tashqari bu matnlar AI'ga ham "bilim bazasi" sifatida beriladi.
//
//  keywords — foydalanuvchi savolida shu so'zlardan biri bo'lsa,
//  shu javob tanlanadi (kichik harflarda, apostrofsiz yozing).
// ============================================================

export const faq = [
  {
    id: 'prep',
    question: { uz: 'Tahlilga qanday tayyorlanish kerak?', ru: 'Как подготовиться к анализам?' },
    keywords: ['tayyor', 'tayyorlan', 'qoida', 'подготов', 'правила'],
    answer: {
      uz:
        'Tahlillarning aniq chiqishi uchun quyidagi qoidalarga amal qiling:\n' +
        '• Och qoringa: tahlildan 8–12 soat oldin ovqat yemang (choy, qahva, sharbatlar ichilmaydi).\n' +
        '• Suv: faqat gazsiz toza suv ichishingiz mumkin.\n' +
        '• Parhez: bir kun oldin yogʻli, qovurilgan taomlar va spirtli ichimliklardan saqlaning.\n' +
        '• Xotirjamlik: qon topshirish kuni ertalab ogʻir sport va hayajondan tiyiling. Laboratoriyaga kelgach 10–15 daqiqa dam oling.',
      ru:
        'Чтобы результаты были точными, соблюдайте правила:\n' +
        '• Натощак: не ешьте 8–12 часов до анализа (чай, кофе, соки тоже нельзя).\n' +
        '• Вода: можно пить только чистую воду без газа.\n' +
        '• Диета: за сутки исключите жирное, жареное и алкоголь.\n' +
        '• Покой: утром перед сдачей избегайте нагрузок и волнения. В лаборатории отдохните 10–15 минут.',
    },
  },
  {
    id: 'fasting',
    question: { uz: 'Qonni och qoringa topshirish kerakmi?', ru: 'Нужно ли сдавать кровь натощак?' },
    keywords: ['och qor', 'nahor', 'ovqat', 'натощак', 'голод', 'есть перед'],
    answer: {
      uz: 'Ha, qon tahlillarining aksariyati (ayniqsa biokimyo, qand miqdori, lipidlar) och qoringa topshirilishi kerak. Tahlildan oldin 8–12 soat ovqatlanmaslik, faqat oddiy gazsiz toza suv ichish tavsiya etiladi.',
      ru: 'Да, большинство анализов крови (особенно биохимия, сахар, липиды) сдаются натощак. За 8–12 часов до анализа не ешьте, пить можно только чистую воду без газа.',
    },
  },
  {
    id: 'results',
    question: { uz: 'Natijalar qachon tayyor boʻladi?', ru: 'Когда будут готовы результаты?' },
    keywords: ['natija', 'qachon', 'tayyor bol', 'muddat', 'результат', 'когда', 'срок'],
    answer: {
      uz: 'Standart umumiy qon va biokimyoviy tahlillar topshirilgan kunning oʻzida (4–8 soat ichida) tayyor boʻladi. Shoshilinch CITO tahlillar 2 soatda, murakkab gormon va PZR tahlillari esa 24 soat ichida tayyor boʻlib, Telegram orqali yuboriladi.',
      ru: 'Общий анализ крови и биохимия готовы в день сдачи (через 4–8 часов). Срочные CITO-анализы — за 2 часа, сложные гормональные и ПЦР — в течение 24 часов, результат отправляем в Telegram.',
    },
  },
  {
    id: 'branch',
    question: { uz: 'Eng yaqin filial qayerda?', ru: 'Где ближайший филиал?' },
    keywords: ['filial', 'manzil', 'qayer', 'adres', 'филиал', 'адрес', 'где'],
    answer: {
      uz: 'Guliston shahrida Markaziy laboratoriya (Xondamir shoh koʻchasi, 63) va Namuna MFYdagi filial, shuningdek Sirdaryo shahri, Yangiyer va Sayxunobodda filiallarimiz bor. Barcha manzillar va xarita — saytdagi “Manzillar” boʻlimida.',
      ru: 'В Гулистане — Центральная лаборатория (ул. Хондамир шох, 63) и филиал в МСГ Намуна, также есть филиалы в г. Сырдарья, Янгиере и Сайхунабаде. Все адреса и карта — в разделе «Адреса» на сайте.',
    },
  },
  {
    id: 'prices',
    question: { uz: 'Narxlar qancha?', ru: 'Сколько стоят анализы?' },
    keywords: ['narx', 'qancha', 'pul', 'нарх', 'цен', 'стоит', 'стоимость', 'сколько'],
    answer: {
      uz: 'Masalan: umumiy qon tahlili — 45 000 soʻm, ALT/AST/Bilirubin — 55 000 soʻm, TSH — 65 000 soʻm, HbA1c — 70 000 soʻm, Vitamin D — 160 000 soʻm. Toʻliq roʻyxat va chegirmali paketlar — “Narxlar” boʻlimida.',
      ru: 'Например: общий анализ крови — 45 000 сум, АЛТ/АСТ/билирубин — 55 000 сум, ТТГ — 65 000 сум, HbA1c — 70 000 сум, витамин D — 160 000 сум. Полный список и пакеты со скидкой — в разделе «Цены».',
    },
  },
  {
    id: 'vaccine',
    question: { uz: 'Emlash haqida maʼlumot', ru: 'Информация о прививках' },
    keywords: ['emla', 'vaksina', 'privivka', 'прививк', 'вакцин'],
    answer: {
      uz: 'Bizda gripp, Gepatit B, ADS-M va boshqa vaksinalar mavjud. Emlashdan oldin shifokor koʻrigi oʻtkaziladi. Saytdagi “Emlash” boʻlimida onlayn yozilishingiz mumkin.',
      ru: 'У нас есть вакцины от гриппа, гепатита B, АДС-М и другие. Перед прививкой проводится осмотр врача. Записаться можно онлайн в разделе «Вакцинация».',
    },
  },
  {
    id: 'kids',
    question: { uz: 'Bolalar uchun tahlil qanday topshiriladi?', ru: 'Как сдают анализы дети?' },
    keywords: ['bola', 'farzand', 'chaqaloq', 'реб', 'дет'],
    answer: {
      uz: 'Bolalardan qon olish maxsus ingichka nina va mikro-probirkalar yordamida tajribali hamshira tomonidan amalga oshiriladi. Bolaga kelishdan oldin 1–2 qultum iliq suv ichirish tavsiya qilinadi.',
      ru: 'У детей кровь берёт опытная медсестра тонкой иглой в микропробирки. Перед визитом дайте ребёнку 1–2 глотка тёплой воды.',
    },
  },
];

// Hech narsa topilmasa
export const fallbackAnswer = {
  uz: 'Savolingiz uchun rahmat! Aniq maʼlumot olish uchun bizga qoʻngʻiroq qiling: {phone}. Shuningdek, quyidagi tezkor savollardan birini tanlashingiz mumkin.',
  ru: 'Спасибо за вопрос! Для точной информации позвоните нам: {phone}. Также можно выбрать один из быстрых вопросов ниже.',
};

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[ʻʼ‘’`'´]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Savol matni bo'yicha eng mos tayyor javobni topadi (topilmasa null)
export function matchFaq(text) {
  const q = norm(text);
  if (!q) return null;
  for (const item of faq) {
    if (norm(item.question.uz) === q || norm(item.question.ru) === q) return item;
  }
  let best = null;
  let bestScore = 0;
  for (const item of faq) {
    const score = item.keywords.reduce((acc, k) => (q.includes(norm(k)) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
