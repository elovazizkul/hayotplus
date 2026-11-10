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
  unassigned: { uz: 'Kimniki nomaʼlum', ru: 'Чьи — неизвестно' },
  unassignedHint: {
    uz: 'Bu tahlillar kimniki ekani hali belgilanmagan. Kvitansiyani oching va pastda «Kimniki ekanini oʻzgartirish» ni bosing.',
    ru: 'Для этих анализов ещё не указано, чьи они. Откройте квитанцию и внизу нажмите «Изменить, чей это анализ».',
  },
  tabAnalytes: { uz: 'Grafiklar', ru: 'Графики' },
  tabVisits: { uz: 'Kvitansiyalar', ru: 'Квитанции' },
  hintTitle: { uz: 'Bu yerda tahlillaringiz saqlanadi', ru: 'Здесь хранятся ваши анализы' },
  hint: {
    uz: '• Tepada — kimning tahlillari: siz va oila aʼzolaringiz.\n• «Grafiklar»: koʻrsatkichni bosing — vaqt boʻyicha oʻzgarishi ochiladi.\n• «Kvitansiyalar»: sanani bosing — oʻsha kungi natijalar va oldingi safar bilan farq.',
    ru: '• Вверху — чьи анализы: ваши и членов семьи.\n• «Графики»: нажмите на показатель — откроется, как он менялся.\n• «Квитанции»: нажмите на дату — результаты того дня и разница с прошлым разом.',
  },
  hintOk: { uz: 'Tushunarli', ru: 'Понятно' },
  receiptsHint: {
    uz: 'Kvitansiyani bosing — natijalar va oldingi safar bilan farq ochiladi',
    ru: 'Нажмите на квитанцию — откроются результаты и разница с прошлым разом',
  },
  chartsHint: { uz: 'Koʻrsatkichni bosing — grafik ochiladi', ru: 'Нажмите на показатель — откроется график' },
  before: { uz: 'oldin ({d}): {v}', ru: 'раньше ({d}): {v}' },
  firstTime: { uz: 'birinchi marta', ru: 'впервые' },
  getPdf: { uz: 'PDF blankni chatga olish', ru: 'Получить PDF бланка в чат' },
  otherOwner: { uz: 'Bu tahlil boshqa oila aʼzosiniki boʻlsa:', ru: 'Если это анализ другого члена семьи:' },
  changeOwner: { uz: 'Kimniki ekanini oʻzgartirish ›', ru: 'Изменить, чей это анализ ›' },
  whose: { uz: 'Bu tahlil kimniki?', ru: 'Чей это анализ?' },
  goalTitle: { uz: '🎯 Shaxsiy maqsad', ru: '🎯 Личная цель' },
  goalNone: { uz: 'Belgilanmagan. Shifokoringiz maqsad aytgan boʻlsa, shu yerga yozing — grafikda toʻq sariq punktir boʻladi.', ru: 'Не задана. Если врач назвал цель, впишите её — на графике будет оранжевый пунктир.' },
  goalLow: { uz: 'Kamida (pastki)', ru: 'Не ниже' },
  goalHigh: { uz: 'Koʻpi bilan (yuqori)', ru: 'Не выше' },
  goalHint: { uz: 'Bittasini toʻldirsangiz ham boʻladi', ru: 'Можно заполнить только одно поле' },
  goalSet: { uz: 'Maqsadni belgilash', ru: 'Задать цель' },
  goalClear: { uz: 'Maqsadni oʻchirish', ru: 'Удалить цель' },
  goalBad: { uz: 'Pastki qiymat yuqoridan katta boʻlmasin', ru: 'Нижнее значение не должно быть больше верхнего' },
  goalLine: { uz: 'punktir — maqsad', ru: 'пунктир — цель' },
  remindOn: { uz: '🔔 Eslatma: har {m} oyda qayta topshirish', ru: '🔔 Напоминание: пересдать каждые {m} мес.' },
  remindOff: { uz: '🔕 Eslatma oʻchirilgan (tavsiya: har {m} oyda)', ru: '🔕 Напоминание выключено (рекомендуется каждые {m} мес.)' },
  turnOff: { uz: 'Oʻchirish', ru: 'Выключить' },
  turnOn: { uz: 'Yoqish', ru: 'Включить' },
  report: { uz: '🩺 Shifokorga koʻrsatish (PDF)', ru: '🩺 Показать врачу (PDF)' },
  reportTitle: { uz: 'Shifokorga koʻrsatish', ru: 'Показать врачу' },
  reportPick: { uz: 'Qaysi koʻrsatkichlar kerak?', ru: 'Какие показатели нужны?' },
  reportPeriod: { uz: 'Qaysi davr?', ru: 'За какой период?' },
  m6: { uz: '6 oy', ru: '6 мес.' },
  m12: { uz: '1 yil', ru: '1 год' },
  mAll: { uz: 'Hammasi', ru: 'Всё время' },
  reportMake: { uz: 'PDF tayyorlash', ru: 'Подготовить PDF' },
  reportSent: { uz: 'PDF tayyorlanmoqda — bir daqiqada bot chatiga keladi', ru: 'PDF готовится — через минуту придёт в чат с ботом' },
  reportNone: { uz: 'Kamida bitta koʻrsatkichni belgilang', ru: 'Отметьте хотя бы один показатель' },
  avatar: { uz: 'Rasm', ru: 'Значок' },
  color: { uz: 'Rang', ru: 'Цвет' },
  who: { uz: 'Kim', ru: 'Кто' },
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
  profileSettings: { uz: 'Profilni tahrirlash: nom va rasm', ru: 'Редактировать профиль: имя и значок' },
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
