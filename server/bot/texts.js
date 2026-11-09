// Bot matnlari: o'zbekcha (lotin) va ruscha. {phone}, {site}, {n}, {d} — o'rniga qiymat qo'yiladi.

export const T = {
  hello: {
    uz: 'Assalomu alaykum! Bu Hayot Plus laboratoriyasining natijalar boti.\n\nNatijani olish uchun kvitansiyadagi QR-kodni saytda skanerlang va «Telegram’ga yuborish» tugmasini bosing:\n{site}\n\nSavollar boʻlsa: {phone}',
    ru: 'Здравствуйте! Это бот результатов лаборатории Hayot Plus.\n\nЧтобы получить результаты, отсканируйте QR-код с квитанции на сайте и нажмите «Отправить в Telegram»:\n{site}\n\nЕсли есть вопросы: {phone}',
  },
  expired: {
    uz: 'Bu havola eskirgan yoki allaqachon ishlatilgan (havola 15 daqiqa amal qiladi).\n\nSaytda QR-kodni qayta skanerlang va «Telegram’ga yuborish» tugmasini yana bosing:\n{site}',
    ru: 'Эта ссылка устарела или уже использована (ссылка действует 15 минут).\n\nОтсканируйте QR-код на сайте ещё раз и снова нажмите «Отправить в Telegram»:\n{site}',
  },
  consent: {
    uz: 'Hayot Plus tahlil natijalarini shu chatga PDF fayl koʻrinishida yuboramiz.\n\nFayl Telegram serverlarida saqlanadi. Rozimisiz?',
    ru: 'Мы пришлём результаты анализов Hayot Plus в этот чат файлом PDF.\n\nФайл хранится на серверах Telegram. Вы согласны?',
  },
  agree: { uz: '✅ Roziman', ru: '✅ Согласен(на)' },
  disagree: { uz: 'Yoʻq', ru: 'Нет' },
  declined: {
    uz: 'Yaxshi, hech narsa yuborilmaydi. Natijalarni saytda koʻrishingiz mumkin:\n{site}',
    ru: 'Хорошо, ничего отправлять не будем. Результаты можно посмотреть на сайте:\n{site}',
  },
  caption: {
    uz: 'Hayot Plus — tahlil natijalari\nBlank №{n}{d}\n\nSavollar boʻlsa: {phone}',
    ru: 'Hayot Plus — результаты анализов\nБланк №{n}{d}\n\nЕсли есть вопросы: {phone}',
  },
  date: { uz: ', sana: {d}', ru: ', дата: {d}' },
  pending: {
    uz: 'Natijalar hali tayyor emas. Kvitansiya saqlandi — uni qayta skanerlash shart emas.\n\nKeyinroq «Tekshirish» tugmasini bosing.',
    ru: 'Результаты ещё не готовы. Квитанция сохранена — сканировать её заново не нужно.\n\nПозже нажмите «Проверить».',
  },
  check: { uz: '🔄 Tekshirish', ru: '🔄 Проверить' },
  wait: { uz: 'Biroz kuting va qayta bosing', ru: 'Подождите немного и нажмите снова' },
  notFound: {
    uz: 'Bu kvitansiya boʻyicha natija topilmadi. Laboratoriyaga qoʻngʻiroq qiling: {phone}',
    ru: 'По этой квитанции результаты не найдены. Позвоните в лабораторию: {phone}',
  },
  lisError: {
    uz: 'Laboratoriya dasturi hozir javob bermayapti. Birozdan keyin «Tekshirish» tugmasini bosing.',
    ru: 'Лабораторная программа сейчас не отвечает. Чуть позже нажмите «Проверить».',
  },
  pdfError: {
    uz: 'PDF faylni tayyorlab boʻlmadi. Birozdan keyin «Tekshirish» tugmasini bosing yoki qoʻngʻiroq qiling: {phone}',
    ru: 'Не удалось подготовить PDF. Чуть позже нажмите «Проверить» или позвоните: {phone}',
  },
  gone: {
    uz: 'Bu kvitansiya maʼlumoti endi saqlanmaydi. Saytda QR-kodni qayta skanerlang:\n{site}',
    ru: 'Данные этой квитанции больше не хранятся. Отсканируйте QR-код на сайте заново:\n{site}',
  },
};

export function say(key, lang, vars = {}) {
  const text = T[key][lang === 'ru' ? 'ru' : 'uz'];
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
}
