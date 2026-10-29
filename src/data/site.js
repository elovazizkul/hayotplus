// ============================================================
//  SAYTNING ASOSIY MA'LUMOTLARI — shu faylni tahrirlang
// ============================================================
//  Telefon, Telegram, Instagram, ish vaqti va "ishonch belgilari"
//  shu yerda. O'zgartirib GitHub'ga saqlasangiz, Vercel saytni
//  avtomatik yangilaydi (1–2 daqiqada).
//
//  ⚠️ Belgilangan joylar ("TEKSHIRING") Google Stitch tomonidan
//  namuna sifatida o'ylab topilgan. Saytni ommaga e'lon qilishdan
//  oldin haqiqiy ma'lumot bilan almashtiring.
// ============================================================

export const site = {
  name: 'Hayot Plus Med',
  url: 'https://hayotplus.uz', // TEKSHIRING: o'z domeningiz (yoki Vercel bergan manzil)

  // Asosiy telefon (sarlavha va tugmalarda ko'rinadi)
  phone: '+998 95 511-00-33',
  phone2: '', // ikkinchi raqam (bo'sh qoldirsangiz ko'rinmaydi)

  telegramBot: 'hayotpluslab_bot', // @ belgisisiz
  telegramChannel: '', // Telegram kanal (bo'sh bo'lsa — bot ko'rsatiladi)
  instagram: '', // Instagram (bo'sh bo'lsa — ko'rinmaydi)

  hours: {
    uz: 'Har kuni: 08:00 dan 18:00 gacha',
    ru: 'Ежедневно: с 08:00 до 18:00',
  },
  hoursNote: {
    uz: 'Dam olish kunlarisiz',
    ru: 'Без выходных',
  },
  foundedYear: 2021,

  // ---------- Ishonch belgilari ----------
  // Haqiqatda mavjud bo'lmagan sertifikat yoki litsenziyani saytga
  // yozish huquqiy muammo tug'diradi. Bo'lmasa — '' (bo'sh) qoldiring,
  // belgi saytda ko'rinmaydi.
  licenseNumber: '', // masalan: '№ 01234' — TEKSHIRING
  // Rasm ustidagi chap yuqori belgi (sertifikat). Hozircha yo'q — null.
  // Kelajakda sertifikat olinsa, masalan:
  // qualityBadge: { title: 'ISO 15189', subtitle: { uz: 'Xalqaro sifat nazorati', ru: 'Международный контроль качества' } },
  qualityBadge: null,
  accuracyBadge: null, // rasm ustidagi o'ng pastki belgi (hozircha yo'q)
  heroTagline: {
    uz: 'Sirdaryo viloyatidagi zamonaviy tibbiy laboratoriya',
    ru: 'Современная медицинская лаборатория Сырдарьинской области',
  },

  // Bosh sahifadagi rasm. O'z laboratoriyangiz suratini public/hero.jpg
  // nomi bilan qo'yib, bu yerga '/hero.jpg' deb yozing — eng yaxshi variant.
  heroImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCuICgiuQuxmdcG4rcx_IDA1ZpXuj0-w4qof_QyWznuFP_SRXMksUAQ8rIUV3QWadKzaBqxoGc90_8mbjsDrEs91-lukbWq2B9ODRdvfwD8UIXyHknJLvHojeK0XvcIhROwAv0hr_xFjs81Sl74lBjDIAOcLaJEDT9MDSZE508T_R20yCbmVYeLN8laPElAMaiPQ_zZa4pNQJvJkGUOx3oL7sRKBH0vsPeGixkAstJX',
};

// "+998 67 225-00-00" → "+998672250000" (tel: havolasi uchun)
export const telHref = (phone) => 'tel:' + String(phone).replace(/[^\d+]/g, '');
