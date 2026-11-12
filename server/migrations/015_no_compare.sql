-- "Solishtirilmaydi": ko'p ko'rsatkichli va sifat tahlillari grafik, Kuzatuv va "Shifokorga" PDF'da ko'rsatilmaydi
-- (bemorni chalg'itmaslik uchun — egasi qarori). Kvitansiyada natija ko'rinadi, "oldin" qatori yo'q.
-- Egasi tanlagan: umumiy qon, umumiy siydik, koagulogramma, gepatitlar, ekspress-testlar, qon guruhi.
-- Natijasi hech qachon raqam bo'lmagan ko'rsatkichlar (manfiy/musbat, "++") Mini App'da avtomatik solishtirilmaydi.
-- Admin panelda har bir ko'rsatkich uchun o'zgartiriladi. (server/bot/key-analytes.js — yangi ko'rsatkichlar uchun xuddi shu qoida)
ALTER TABLE lab_analytes ADD COLUMN no_compare boolean NOT NULL DEFAULT false;

UPDATE lab_analytes SET no_compare = true
WHERE group_title ~* '(общий анализ крови|general blood|umumiy qon|анализ мочи|siydik|коагул|гемостаз|koagul|гепатит|hepatit|экспресс|express|группа крови|резус|qon guruhi)'
   OR lis_name ~* '(гепатит|hepatit|hbsag|hcv|hiv|вич|сифилис|express|экспресс|резус)';
