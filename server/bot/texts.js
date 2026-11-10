// Bot matnlari: o'zbekcha (lotin) va ruscha. {phone}, {site}, {n}, {d} — o'rniga qiymat qo'yiladi.

export const T = {
  hello: {
    uz: 'Assalomu alaykum! Bu Hayot Plus laboratoriyasining natijalar boti.\n\nNatijani olish uchun kvitansiyadagi QR-kodni saytda skanerlang va «Telegram’ga yuborish» tugmasini bosing:\n{site}\n\nSavollar boʻlsa: {phone}\nMaʼlumotlaringizni oʻchirish: /ochirish',
    ru: 'Здравствуйте! Это бот результатов лаборатории Hayot Plus.\n\nЧтобы получить результаты, отсканируйте QR-код с квитанции на сайте и нажмите «Отправить в Telegram»:\n{site}\n\nЕсли есть вопросы: {phone}\nУдалить ваши данные: /ochirish',
  },
  dataConsent: {
    uz: 'Natijalaringiz raqamlarini bazamizda saqlaylikmi? Ular keyinchalik oʻzgarishlarni (grafik) koʻrsatish uchun kerak boʻladi.\n\nIsm-familiya saqlanmaydi. Istalgan vaqtda /ochirish buyrugʻi bilan hammasini oʻchirishingiz mumkin.',
    ru: 'Сохранить цифры ваших результатов в нашей базе? Они понадобятся, чтобы потом показывать изменения (графики).\n\nФИО не сохраняется. В любой момент можно удалить всё командой /ochirish.',
  },
  dataYes: { uz: '✅ Ha, saqlansin', ru: '✅ Да, сохранить' },
  dataNo: { uz: 'Yoʻq', ru: 'Нет' },
  dataDeclined: {
    uz: 'Yaxshi, raqamlar saqlanmaydi. PDF natijalar avvalgidek keladi.',
    ru: 'Хорошо, цифры сохраняться не будут. PDF с результатами будут приходить, как и раньше.',
  },
  whose: { uz: 'Bu kimning tahlili?{year}', ru: 'Чей это анализ?{year}' },
  whoseYear: { uz: '\n(Blankda tugʻilgan yili: {y})', ru: '\n(Год рождения на бланке: {y})' },
  whoseGuess: { uz: 'Bu tahlil kimniki — {who}?', ru: 'Чей это анализ — {who}?' },
  yes: { uz: 'Ha', ru: 'Да' },
  otherPerson: { uz: 'Boshqa odam', ru: 'Другой человек' },
  profileSaved: {
    uz: 'Saqlandi: {who}. Keyingi tahlillar ham shu profilga qoʻshiladi.',
    ru: 'Сохранено: {who}. Следующие анализы тоже будут добавляться в этот профиль.',
  },
  deleteAsk: {
    uz: 'Barcha maʼlumotlaringiz oʻchirilsinmi? Kvitansiyalar, raqamlar, profillar va roziligingiz oʻchadi. Buni qaytarib boʻlmaydi.',
    ru: 'Удалить все ваши данные? Будут удалены квитанции, цифры, профили и ваше согласие. Это нельзя отменить.',
  },
  deleteYes: { uz: '🗑 Ha, oʻchirilsin', ru: '🗑 Да, удалить' },
  deleteNo: { uz: 'Bekor qilish', ru: 'Отмена' },
  deleted: {
    uz: 'Barcha maʼlumotlaringiz oʻchirildi. Bot sizga boshqa hech narsa yubormaydi.',
    ru: 'Все ваши данные удалены. Бот больше ничего вам не пришлёт.',
  },
  openApp: { uz: '📊 Mening tahlillarim', ru: '📊 Мои анализы' },
  lisLater: {
    uz: 'Laboratoriya dasturi hozir javob bermayapti. Birozdan keyin qayta urinib koʻring.',
    ru: 'Лабораторная программа сейчас не отвечает. Попробуйте чуть позже.',
  },
  deleteCancelled: { uz: 'Bekor qilindi, hech narsa oʻchirilmadi.', ru: 'Отменено, ничего не удалено.' },
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
    uz: 'Natijalar hali tayyor emas. Kvitansiya saqlandi — uni qayta skanerlash shart emas.\n\nTayyor boʻlishi bilan shu yerga oʻzimiz yuboramiz. Xohlasangiz, «Tekshirish» tugmasini bosing.',
    ru: 'Результаты ещё не готовы. Квитанция сохранена — сканировать её заново не нужно.\n\nКак только будут готовы, мы сами пришлём их сюда. Можно и проверить вручную — кнопка «Проверить».',
  },
  operator: {
    uz: 'Natijalar hali tayyor emas. Baʼzi tahlillar boshqa laboratoriyada bajariladi — qolgan natijalarni operatorimiz alohida yuboradi.\n\nNatija bizning dasturda paydo boʻlsa, shu yerga ham yuboramiz. Savollar boʻlsa: {phone}',
    ru: 'Результаты ещё не готовы. Некоторые анализы выполняются в другой лаборатории — оставшиеся результаты наш оператор пришлёт отдельно.\n\nЕсли результат появится в нашей программе, мы пришлём его и сюда. Если есть вопросы: {phone}',
  },
  readyAuto: { uz: '✅ Natijalaringiz tayyor!\n\n', ru: '✅ Ваши результаты готовы!\n\n' },
  updated: { uz: '🔄 Natijalar yangilandi — toʻliq variant.\n\n', ru: '🔄 Результаты обновились — полная версия.\n\n' },
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

// Profil turlari ("Bu kimning tahlili?")
export const RELATIONS = ['self', 'father', 'mother', 'child', 'spouse', 'other'];
const REL_NAMES = {
  self: { uz: 'Men', ru: 'Я' },
  father: { uz: 'Otam', ru: 'Отец' },
  mother: { uz: 'Onam', ru: 'Мама' },
  child: { uz: 'Farzandim', ru: 'Ребёнок' },
  spouse: { uz: 'Turmush oʻrtogʻim', ru: 'Супруг(а)' },
  other: { uz: 'Boshqa odam', ru: 'Другой человек' },
};

// "Otam (1958)"; egasi (4-bosqich) profilni qayta nomlasa — o'sha nom
export function profileName(p, lang) {
  const base = p.label || (REL_NAMES[p.relation] || REL_NAMES.other)[lang === 'ru' ? 'ru' : 'uz'];
  return p.birth_year ? `${base} (${p.birth_year})` : base;
}

export function say(key, lang, vars = {}) {
  const text = T[key][lang === 'ru' ? 'ru' : 'uz'];
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
}
