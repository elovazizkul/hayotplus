// Mini App "Mening tahlillarim" matnlari: o'zbekcha (lotin) va ruscha

export const T = {
  title: { uz: 'Mening tahlillarim', ru: 'Мои анализы' },
  loading: { uz: 'Yuklanmoqda...', ru: 'Загрузка...' },
  notInTelegram: {
    uz: 'Bu sahifa Telegram ichida, natijalar boti orqali ochiladi.',
    ru: 'Эта страница открывается внутри Telegram, через бот результатов.',
  },
  noUser: {
    uz: 'Avval natijangizni bot orqali oling: saytda QR-kodni skanerlang va «Telegram’ga yuborish» tugmasini bosing.',
    ru: 'Сначала получите результат через бот: отсканируйте QR-код на сайте и нажмите «Отправить в Telegram».',
  },
  error: { uz: 'Maʼlumotni olib boʻlmadi. Birozdan keyin qayta urinib koʻring.', ru: 'Не удалось загрузить данные. Попробуйте чуть позже.' },
  retry: { uz: 'Qayta urinish', ru: 'Повторить' },
  noConsent: {
    uz: 'Grafiklar uchun natijalaringiz raqamlarini saqlashga ruxsat kerak. Ism-familiya saqlanmaydi, istalgan vaqtda botda /ochirish bilan oʻchirasiz.',
    ru: 'Для графиков нужно разрешить сохранять цифры ваших результатов. ФИО не сохраняется, удалить можно в любой момент командой /ochirish в боте.',
  },
  enableConsent: { uz: 'Raqamlarni saqlashga ruxsat beraman', ru: 'Разрешаю сохранять цифры' },
  consentDone: {
    uz: 'Rahmat! Avvalgi natijalaringiz bir necha daqiqada shu yerda paydo boʻladi.',
    ru: 'Спасибо! Ваши прежние результаты появятся здесь через несколько минут.',
  },
  empty: {
    uz: 'Hali raqamlar yoʻq. Natija botga kelgach, shu yerda koʻrinadi.',
    ru: 'Цифр пока нет. Когда результат придёт в бот, он появится здесь.',
  },
  unassigned: { uz: 'Profilsiz', ru: 'Без профиля' },
  unassignedHint: {
    uz: 'Bu kvitansiyalar hali hech kimning profiliga qoʻshilmagan. «Tashriflar» boʻlimida «Koʻchirish» tugmasi bilan joylang.',
    ru: 'Эти квитанции ещё не добавлены ни в один профиль. Разложите их кнопкой «Перенести» в разделе «Визиты».',
  },
  tabAnalytes: { uz: 'Koʻrsatkichlar', ru: 'Показатели' },
  tabVisits: { uz: 'Tashriflar', ru: 'Визиты' },
  favorites: { uz: '★ Tanlanganlar', ru: '★ Избранное' },
  all: { uz: 'Barcha koʻrsatkichlar', ru: 'Все показатели' },
  times: { uz: '{n} marta', ru: '{n} раз' },
  sexAsk: {
    uz: 'Meʼyorlar jinsga bogʻliq. Bu profil kimniki — erkak yoki ayol?',
    ru: 'Нормы зависят от пола. Чей это профиль — мужчины или женщины?',
  },
  male: { uz: 'Erkak', ru: 'Мужчина' },
  female: { uz: 'Ayol', ru: 'Женщина' },
  norm: { uz: 'yashil — meʼyor', ru: 'зелёное — норма' },
  noNumbers: { uz: 'Bu koʻrsatkich raqam emas — qiymatlar pastdagi jadvalda.', ru: 'Этот показатель не числовой — значения в таблице ниже.' },
  date: { uz: 'Sana', ru: 'Дата' },
  value: { uz: 'Natija', ru: 'Результат' },
  ref: { uz: 'Meʼyor', ru: 'Норма' },
  addFav: { uz: '☆ Tanlanganlarga qoʻshish', ru: '☆ В избранное' },
  removeFav: { uz: '★ Tanlanganlardan olib tashlash', ru: '★ Убрать из избранного' },
  blank: { uz: 'Blank №{n}', ru: 'Бланк №{n}' },
  items: { uz: '{n} ta koʻrsatkich', ru: 'показателей: {n}' },
  pdf: { uz: 'PDF', ru: 'PDF' },
  pdfSent: { uz: 'PDF bot chatiga yuborilmoqda', ru: 'PDF отправляется в чат с ботом' },
  pdfGone: { uz: 'Bu kvitansiya kaliti eskirgan — PDF ni olib boʻlmaydi', ru: 'Ключ этой квитанции устарел — PDF получить нельзя' },
  move: { uz: 'Koʻchirish', ru: 'Перенести' },
  moveTo: { uz: 'Qaysi profilga koʻchiramiz?', ru: 'В какой профиль перенести?' },
  moved: { uz: 'Koʻchirildi', ru: 'Перенесено' },
  cancel: { uz: 'Bekor qilish', ru: 'Отмена' },
  compare: { uz: 'Ikki tashrifni solishtirish', ru: 'Сравнить два визита' },
  comparePick: { uz: 'Solishtirish uchun ikkita tashrifni belgilang', ru: 'Отметьте два визита для сравнения' },
  compareShow: { uz: 'Solishtirish', ru: 'Сравнить' },
  compareTitle: { uz: 'Solishtirish', ru: 'Сравнение' },
  wasNow: { uz: 'Oldin → keyin', ru: 'Было → стало' },
  profileSettings: { uz: 'Profil sozlamalari', ru: 'Настройки профиля' },
  profileName: { uz: 'Profil nomi', ru: 'Название профиля' },
  save: { uz: 'Saqlash', ru: 'Сохранить' },
  saved: { uz: 'Saqlandi', ru: 'Сохранено' },
  sex: { uz: 'Jinsi', ru: 'Пол' },
  footer: {
    uz: 'Grafik maʼlumot uchun. Xulosani shifokor chiqaradi.',
    ru: 'График — для информации. Заключение делает врач.',
  },
};

export const REL = {
  self: { uz: 'Men', ru: 'Я' },
  father: { uz: 'Otam', ru: 'Отец' },
  mother: { uz: 'Onam', ru: 'Мама' },
  child: { uz: 'Farzandim', ru: 'Ребёнок' },
  spouse: { uz: 'Turmush oʻrtogʻim', ru: 'Супруг(а)' },
  other: { uz: 'Boshqa odam', ru: 'Другой человек' },
};

export const tr = (key, lang, vars = {}) =>
  (T[key]?.[lang] ?? T[key]?.uz ?? key).replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));

export const profileTitle = (p, lang) => {
  const base = p.label || (REL[p.relation] || REL.other)[lang];
  return p.birth_year ? `${base} (${p.birth_year})` : base;
};

export const analyteName = (a, lang) => (lang === 'ru' ? a.name_ru || a.name_uz : a.name_uz) || a.lis_name;

// "2026-11-09" → "09.11.2026"
export const fmtDay = (d) => (d ? d.split('-').reverse().join('.') : '');
