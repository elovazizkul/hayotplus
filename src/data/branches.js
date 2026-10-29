// ============================================================
//  FILIALLAR — manzil, telefon, ish vaqti va xaritadagi joyi
// ============================================================
//  lat / lng — xaritadagi nuqta. Aniq koordinatani olish uchun:
//  Google Maps'da binoga o'ng tugma bilan bosing → birinchi qatordagi
//  raqamlarni (masalan 40.49340, 68.78783) nusxalang.
//
//  phone va hours — ixtiyoriy. Bo'sh qoldirilsa ('') saytda ko'rinmaydi.
//  landmark — mo'ljal (ixtiyoriy).
//  Filial qo'shish/o'chirish — shunchaki { ... } blokini nusxalash yoki o'chirish.
// ============================================================

export const branches = [
  {
    id: 'main',
    main: true,
    icon: 'corporate_fare',
    name: { uz: 'Guliston shahar Markaziy laboratoriyasi', ru: 'Центральная лаборатория г. Гулистан' },
    short: { uz: 'Markaziy laboratoriya', ru: 'Центральная лаборатория' },
    city: { uz: 'Guliston', ru: 'Гулистан' },
    address: {
      uz: 'Sirdaryo viloyati, Guliston shahar, Xondamir shoh koʻchasi, 63-uy',
      ru: 'Сырдарьинская обл., г. Гулистан, ул. Хондамир шох, 63',
    },
    hours: '', // masalan: '08:00–18:00'
    phone: '', // masalan: '+998 67 225-00-00'
    lat: 40.493404,
    lng: 68.787832,
  },
  {
    id: 'guliston-namuna',
    icon: 'location_on',
    name: { uz: 'Guliston shahar filiali', ru: 'Филиал в г. Гулистан' },
    short: { uz: 'Guliston filiali', ru: 'Филиал Гулистан' },
    city: { uz: 'Guliston', ru: 'Гулистан' },
    address: {
      uz: 'Guliston shahar, Namuna MFY, Birlashgan koʻchasi, 2-uy',
      ru: 'г. Гулистан, МСГ Намуна, ул. Бирлашган, 2',
    },
    hours: '',
    phone: '',
    lat: 40.501592,
    lng: 68.771604,
  },
  {
    id: 'sirdaryo',
    icon: 'location_on',
    name: { uz: 'Sirdaryo shahar filiali', ru: 'Филиал в г. Сырдарья' },
    short: { uz: 'Sirdaryo filiali', ru: 'Филиал Сырдарья' },
    city: { uz: 'Sirdaryo', ru: 'Сырдарья' },
    address: {
      uz: 'Sirdaryo shahar, Bahor MFY, Oʻzbekiston koʻchasi, 73-uy',
      ru: 'г. Сырдарья, МСГ Бахор, ул. Узбекистан, 73',
    },
    hours: '',
    phone: '',
    lat: 40.826102,
    lng: 68.667317,
  },
  {
    id: 'yangiyer',
    icon: 'location_on',
    name: { uz: 'Yangiyer shahar filiali', ru: 'Филиал в г. Янгиер' },
    short: { uz: 'Yangiyer filiali', ru: 'Филиал Янгиер' },
    city: { uz: 'Yangiyer', ru: 'Янгиер' },
    address: {
      uz: 'Yangiyer shahar, Zahiriddin Muhammad Bobur MFY, Zahiriddin Muhammad Bobur koʻchasi, 1a-uy',
      ru: 'г. Янгиер, МСГ Захириддин Мухаммад Бобур, ул. Захириддин Мухаммад Бобур, 1а',
    },
    hours: '',
    phone: '',
    lat: 40.267558,
    lng: 68.792864,
  },
  {
    id: 'sayxunobod',
    icon: 'location_on',
    name: { uz: 'Sayxunobod filiali', ru: 'Филиал Сайхунабад' },
    short: { uz: 'Sayxunobod filiali', ru: 'Филиал Сайхунабад' },
    city: { uz: 'Sayxunobod', ru: 'Сайхунабад' },
    address: {
      uz: 'Sayxunobod tumani, Ittifoq SSG, Gulbuloq MSG, Shifokorlar koʻchasi, 5a-uy',
      ru: 'Сайхунабадский р-н, ССГ Иттифок, МСГ Гулбулок, ул. Шифокорлар, 5а',
    },
    hours: '',
    phone: '',
    lat: 40.711555,
    lng: 68.85,
  },
];

// Xaritada ochish (Yandex) va yo'nalish olish (Google) havolalari
export const yandexMapUrl = (b) => `https://yandex.uz/maps/?pt=${b.lng},${b.lat}&z=17&l=map`;
export const directionsUrl = (b) => `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;
