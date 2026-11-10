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
