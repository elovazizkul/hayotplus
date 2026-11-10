-- "Asosiy ko'rsatkich": umumiy qon va siydik tahlilida faqat asosiylar va me'yordan tashqarilar ko'rinadi.
-- Egasi tanlagan: qon — gemoglobin, leykotsitlar, neytrofillar, EChT (СОЭ);
-- siydik — oqsil, leykotsitlar, eritrotsitlar, glyukoza, nisbiy zichlik. Admin panelda o'zgartiriladi.
-- (server/bot/key-analytes.js — yangi ko'rsatkichlar uchun xuddi shu qoida)
ALTER TABLE lab_analytes ADD COLUMN is_key boolean NOT NULL DEFAULT false;

UPDATE lab_analytes SET is_key = true
WHERE group_title ~* '(общий анализ крови|general blood|umumiy qon)'
  AND (lis_name ~* '^\s*гемоглобин' OR lis_name ~* '^\s*лейкоцит' OR lis_name ~* '^\s*нейтрофил' OR lis_name ~* '(оседани|sedimentation|соэ)');

UPDATE lab_analytes SET is_key = true
WHERE group_title ~* '(общий анализ мочи|umumiy siydik)'
  AND (lis_name ~* '^\s*белок' OR lis_name ~* '^\s*лейкоцит' OR lis_name ~* '^\s*эритроцит' OR lis_name ~* '^\s*глюкоз' OR lis_name ~* '(плотност|удельн)');
