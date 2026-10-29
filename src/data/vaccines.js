// ============================================================
//  EMLASH — vaksinalar ro'yxati va eslatmalar
// ============================================================
//  ⚠️ TEKSHIRING: vaksina nomlari, ishlab chiqaruvchi va narxlar
//  Stitch dizaynidan olingan namuna. Haqiqiy ro'yxat bilan almashtiring.
//  priceFrom: true — narx oldiga "...dan" qo'shiladi.
// ============================================================

export const vaccines = [
  {
    id: 'flu',
    icon: 'shield',
    iconColor: 'primary',
    tag: { uz: 'Fransiya / Janubiy Koreya', ru: 'Франция / Южная Корея' },
    name: { uz: 'Grippga qarshi emlash', ru: 'Вакцинация от гриппа' },
    desc: {
      uz: 'GC Flu / VaxigripTetra mavsumiy toʻrt valentli xalqaro vaksina.',
      ru: 'Сезонная четырёхвалентная вакцина GC Flu / VaxigripTetra.',
    },
    price: 160000,
    note: { uz: 'Sertifikatlangan', ru: 'Сертифицирована' },
  },
  {
    id: 'hepb',
    icon: 'healing',
    iconColor: 'secondary',
    tag: { uz: 'Kattalar va bolalar', ru: 'Взрослые и дети' },
    name: { uz: 'Gepatit B vaksinasi', ru: 'Вакцина от гепатита B' },
    desc: {
      uz: 'Jigar karsinomasi va surunkali virusli gepatitdan ishonchli himoya.',
      ru: 'Надёжная защита от хронического вирусного гепатита и карциномы печени.',
    },
    price: 110000,
    note: { uz: '3 bosqichli', ru: '3 этапа' },
  },
  {
    id: 'adsm',
    icon: 'vaccines',
    iconColor: 'primary',
    tag: { uz: 'Rejali revaksinatsiya', ru: 'Плановая ревакцинация' },
    name: { uz: 'Qoqshol va boʻgʻmaga qarshi (ADS-M)', ru: 'Против столбняка и дифтерии (АДС-М)' },
    desc: {
      uz: 'Jarohatlanish xavfi yuqori boʻlganlar va rejali profilaktika uchun.',
      ru: 'Для плановой профилактики и людей с высоким риском травм.',
    },
    price: 80000,
    note: { uz: 'Xavfsiz', ru: 'Безопасно' },
  },
  {
    id: 'other',
    icon: 'medication',
    iconColor: 'secondary',
    tag: { uz: 'Buyurtma asosida', ru: 'Под заказ' },
    name: { uz: 'Boshqa vaksinalar (Pnevmokokk, Qizamiq)', ru: 'Другие вакцины (пневмококк, корь)' },
    desc: {
      uz: 'Prevenar 13, MMR va maxsus chet el sayohatlari uchun profilaktika.',
      ru: 'Превенар 13, MMR и профилактика перед зарубежными поездками.',
    },
    price: 190000,
    priceFrom: true,
    note: { uz: 'Oldindan yozilish', ru: 'По предварительной записи' },
  },
];

export const vaccineRules = [
  {
    title: { uz: 'Majburiy shifokor koʻrigi', ru: 'Обязательный осмотр врача' },
    text: {
      uz: 'Emlashdan avval filialimizning pediatr yoki terapevt shifokori tomonidan toʻliq tekshiruv oʻtkaziladi.',
      ru: 'Перед прививкой педиатр или терапевт нашего филиала проводит полный осмотр.',
    },
  },
  {
    title: { uz: 'Sogʻlom holat', ru: 'Состояние здоровья' },
    text: {
      uz: 'Oʻtkir shamollash, yuqori tana harorati (37°C+) yoki surunkali kasalliklar xuruj qilmagan boʻlishi zarur.',
      ru: 'Не должно быть острой простуды, температуры (37°C+) или обострения хронических заболеваний.',
    },
  },
  {
    title: { uz: 'Allergiya tarixi', ru: 'Аллергоанамнез' },
    text: {
      uz: 'Dori vositalari, tovuq oqsili yoki avvalgi vaksinalarga reaksiyalar haqida shifokorga xabar bering.',
      ru: 'Сообщите врачу о реакциях на лекарства, куриный белок или предыдущие прививки.',
    },
  },
];
