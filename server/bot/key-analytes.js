// "Asosiy ko'rsatkich" — umumiy qon va siydik tahlilida faqat shular (va me'yordan tashqarilar) ko'rinadi,
// qolganlari "yana N ta" ostida yig'iladi. Ro'yxatni egasi (shifokor) tanlagan; admin panelda o'zgartiriladi.
// Bu yerda — yangi ko'rsatkich bazaga birinchi marta tushganda avtomatik belgilash uchun.
// Eslatma: ToDevelop nomlarida ba'zan lotin harflari aralash ("Cкорость" — lotin C), shuning uchun boshini emas, mazmunini qidiramiz.

const RULES = [
  {
    group: /общий анализ крови|general blood|umumiy qon/i,
    names: [/^гемоглобин/i, /^лейкоцит/i, /^нейтрофил/i, /оседани|sedimentation|соэ/i],
  },
  {
    group: /общий анализ мочи|umumiy siydik/i,
    names: [/^белок/i, /^лейкоцит/i, /^эритроцит/i, /^глюкоз/i, /плотност|удельн/i],
  },
];

export function isKeyAnalyte(groupTitle, name) {
  const rule = RULES.find((r) => r.group.test(groupTitle || ''));
  return Boolean(rule && rule.names.some((re) => re.test(String(name || '').trim())));
}

// "Solishtirilmaydi" — grafik, Kuzatuv va "Shifokorga" PDF'da yo'q (015 migratsiya bilan bir xil shart).
const NO_COMPARE_GROUP = /общий анализ крови|general blood|umumiy qon|анализ мочи|siydik|коагул|гемостаз|koagul|гепатит|hepatit|экспресс|express|группа крови|резус|qon guruhi/i;
const NO_COMPARE_NAME = /гепатит|hepatit|hbsag|hcv|hiv|вич|сифилис|express|экспресс|резус/i;

export function isNoCompare(groupTitle, name) {
  return NO_COMPARE_GROUP.test(groupTitle || '') || NO_COMPARE_NAME.test(String(name || ''));
}

// Laboratoriya tavsiyasi (necha oyda qayta topshirish) — yangi ko'rsatkich birinchi marta tushganda.
// Egasi misoli: glikirlangan gemoglobin (HbA1c) — har 3 oyda (014 migratsiya bilan bir xil shart).
// Keyin admin panelda o'zgartirilsa — o'sha qiymat qoladi, bu yerda qayta yozilmaydi.
const REMIND = [{ name: /гликир|hba1c/i, months: 3 }];

export function defaultRemindMonths(name) {
  const rule = REMIND.find((r) => r.name.test(String(name || '')));
  return rule ? rule.months : 0;
}
