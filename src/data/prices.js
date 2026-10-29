// ============================================================
//  NARXLAR — tahlillar va check-up paketlari
// ============================================================
//  Yangi tahlil qo'shish: bitta { ... } blokini nusxalab, pastga
//  qo'shing va matnlarini o'zgartiring. `id` takrorlanmasin.
//  price — so'mda, faqat raqam (bo'shliqsiz): 45000
//  keywords — qidiruvda topilishi uchun qo'shimcha so'zlar
//
//  ⚠️ TEKSHIRING: narxlar Stitch dizaynidan olingan namuna.
// ============================================================

export const categories = [
  { id: 'all', label: { uz: 'Barchasi', ru: 'Все' } },
  { id: 'umumiy', label: { uz: 'Umumiy qon tahlili', ru: 'Общий анализ крови' } },
  { id: 'biokimyo', label: { uz: 'Biokimyo', ru: 'Биохимия' } },
  { id: 'gormon', label: { uz: 'Gormonlar', ru: 'Гормоны' } },
  { id: 'diabet', label: { uz: 'Qandli diabet', ru: 'Сахарный диабет' } },
  { id: 'qalqonsimon', label: { uz: 'Qalqonsimon bez', ru: 'Щитовидная железа' } },
  { id: 'vitamin', label: { uz: 'Vitaminlar', ru: 'Витамины' } },
  { id: 'pzr', label: { uz: 'PZR tekshiruvi', ru: 'ПЦР-диагностика' } },
];

export const tests = [
  {
    id: 'uqt',
    category: 'umumiy',
    name: { uz: 'Umumiy qon tahlili (UQT) 24 parametr + ECHT', ru: 'Общий анализ крови (ОАК) 24 параметра + СОЭ' },
    desc: {
      uz: 'Leykotsitlar, eritrotsitlar, trombotsitlar, gemoglobin va eritrotsitlar choʻkish tezligi',
      ru: 'Лейкоциты, эритроциты, тромбоциты, гемоглобин и скорость оседания эритроцитов',
    },
    sample: { uz: 'Qon', ru: 'Кровь' },
    days: 1,
    price: 45000,
    keywords: 'uqt oak cbc soe echt gemoglobin',
  },
  {
    id: 'leyko',
    category: 'umumiy',
    name: { uz: 'Leykotsitar formula mikroskopiyasi', ru: 'Лейкоцитарная формула (микроскопия)' },
    desc: {
      uz: 'Morfologik xususiyatlarni shifokor-laborant tomonidan mikroskop ostida aniqlash',
      ru: 'Оценка морфологии клеток врачом-лаборантом под микроскопом',
    },
    sample: { uz: 'Mikroskopiya', ru: 'Микроскопия' },
    days: 1,
    price: 30000,
  },
  {
    id: 'koagulogramma',
    category: 'umumiy',
    name: { uz: 'Koagulogramma (Qon ivishi tahlili)', ru: 'Коагулограмма (свёртываемость крови)' },
    desc: {
      uz: 'Protrombin (PT), MNO (INR), Fibrinogen, APTTV koʻrsatkichlari majmuasi',
      ru: 'Протромбин (ПВ), МНО (INR), фибриноген, АЧТВ',
    },
    sample: { uz: 'Plazma', ru: 'Плазма' },
    accent: 'secondary',
    days: 1,
    price: 75000,
    keywords: 'pt inr mno fibrinogen achtv aptt',
  },
  {
    id: 'jigar',
    category: 'biokimyo',
    name: { uz: 'Biokimyoviy tahlil: ALT, AST, Bilirubin', ru: 'Биохимия: АЛТ, АСТ, билирубин' },
    desc: {
      uz: 'Jigar fermentlari faolligi va umumiy/bogʻlangan bilirubin darajasi',
      ru: 'Активность печёночных ферментов, общий и прямой билирубин',
    },
    sample: { uz: 'Zardob', ru: 'Сыворотка' },
    days: 1,
    price: 55000,
    keywords: 'alt ast alat asat bilirubin jigar pechen',
  },
  {
    id: 'ferritin',
    category: 'biokimyo',
    name: { uz: 'Ferritin va qon zardobi temiri', ru: 'Ферритин и сывороточное железо' },
    desc: {
      uz: 'Organizmda yashirin temir tanqisligi va anemiya xavfini erta aniqlash',
      ru: 'Раннее выявление скрытого дефицита железа и риска анемии',
    },
    sample: { uz: 'Zardob', ru: 'Сыворотка' },
    days: 1,
    price: 85000,
    keywords: 'temir jelezo anemiya kamqonlik',
  },
  {
    id: 'tsh',
    category: 'qalqonsimon',
    name: { uz: 'TSH (Qalqonsimon bez gormoni)', ru: 'ТТГ (тиреотропный гормон)' },
    desc: {
      uz: 'Tireotrop gormon (TTG) — qalqonsimon bez faoliyatining boshqaruvchi markazi',
      ru: 'Тиреотропный гормон — главный регулятор работы щитовидной железы',
    },
    sample: { uz: 'Gipofiz / Zardob', ru: 'Гипофиз / Сыворотка' },
    accent: 'secondary',
    days: 1,
    price: 65000,
    keywords: 'ttg tsh tireotrop gormon shchitovidka',
  },
  {
    id: 'hba1c',
    category: 'diabet',
    name: { uz: 'Glikolizlangan gemoglobin (HbA1c)', ru: 'Гликированный гемоглобин (HbA1c)' },
    desc: {
      uz: 'Oxirgi 3 oylik qon qandining oʻrtacha darajasini aniqlovchi xalqaro oltin standart',
      ru: 'Средний уровень сахара крови за последние 3 месяца — международный «золотой стандарт»',
    },
    sample: { uz: 'Qon', ru: 'Кровь' },
    days: 1,
    price: 70000,
    keywords: 'hba1c glikirovanniy qand diabet saxar',
  },
  {
    id: 'vitd',
    category: 'vitamin',
    name: { uz: 'Vitamin D (25-OH D3)', ru: 'Витамин D (25-OH D3)' },
    desc: {
      uz: 'Suyak zichligi, immunitet va umumiy quvvat uchun muhim gormonal vitamin',
      ru: 'Важен для плотности костей, иммунитета и общего самочувствия',
    },
    sample: { uz: 'Zardob', ru: 'Сыворотка' },
    accent: 'secondary',
    days: 1,
    price: 160000,
    keywords: 'd3 vitamin d 25-oh kalsiy',
  },
];

export const packages = [
  {
    id: 'pkg-diabet',
    icon: 'bloodtype',
    iconColor: 'primary',
    badge: { uz: 'Tejamkor -20%', ru: 'Выгодно -20%' },
    badgeStyle: 'primary',
    name: { uz: 'Qandli diabet tekshiruvi', ru: 'Обследование на диабет' },
    desc: {
      uz: 'Glyukoza, HbA1c, Qon zardobidagi insulin, Siydik mikroalbumin miqdori.',
      ru: 'Глюкоза, HbA1c, инсулин в сыворотке, микроальбумин в моче.',
    },
    price: 185000,
  },
  {
    id: 'pkg-thyroid',
    icon: 'vital_signs',
    iconColor: 'secondary',
    badge: { uz: 'Mashhur', ru: 'Популярно' },
    badgeStyle: 'secondary',
    name: { uz: 'Qalqonsimon bez paneli', ru: 'Панель щитовидной железы' },
    desc: {
      uz: 'TSH (TTG), Erkin T3, Erkin T4, Tireoperoksidazaga antitanachalar (Anti-TPO).',
      ru: 'ТТГ, свободный Т3, свободный Т4, антитела к ТПО (Анти-ТПО).',
    },
    price: 240000,
  },
  {
    id: 'pkg-checkup',
    icon: 'health_and_safety',
    iconColor: 'primary',
    badge: { uz: 'Toʻliq check-up', ru: 'Полный check-up' },
    badgeStyle: 'primary',
    name: { uz: 'Umumiy sogʻlomlashtirish paketi', ru: 'Комплексный check-up' },
    desc: {
      uz: 'UQT, Biokimyo 8 ta asosiy koʻrsatkich, Lipid spektri, Vitamin D darajasi.',
      ru: 'ОАК, 8 основных биохимических показателей, липидный спектр, витамин D.',
    },
    price: 380000,
  },
  {
    id: 'pkg-women',
    icon: 'female',
    iconColor: 'primary',
    badge: { uz: 'Ayollar uchun', ru: 'Для женщин' },
    badgeStyle: 'neutral',
    name: { uz: 'Ayollar salomatligi', ru: 'Женское здоровье' },
    desc: {
      uz: 'Gormonal profil (FSH, LH, Prolaktin), Ferritin, Ionlashgan kalsiy, Onkomarkerlar.',
      ru: 'Гормональный профиль (ФСГ, ЛГ, пролактин), ферритин, ионизированный кальций, онкомаркеры.',
    },
    price: 350000,
  },
  {
    id: 'pkg-kids',
    icon: 'child_care',
    iconColor: 'secondary',
    badge: { uz: 'Pediatriya', ru: 'Педиатрия' },
    badgeStyle: 'secondary',
    name: { uz: 'Bolalar uchun paket', ru: 'Детский пакет' },
    desc: {
      uz: 'UQT, Umumiy siydik tahlili, Gijja tuxumlari tekshiruvi (koprogramma), Qon guruhi va rezus omil.',
      ru: 'ОАК, общий анализ мочи, кал на яйца глист (копрограмма), группа крови и резус-фактор.',
    },
    price: 120000,
  },
];

export const formatPrice = (n, lang = 'uz') =>
  n.toLocaleString('ru-RU').replace(/ /g, ' ') + (lang === 'ru' ? ' сум' : ' soʻm');
