-- Tuzatish: "Аббревиатура" ustuni bor blanklarda natija o'rniga qisqartma (PDW, RDW-CV), birlik o'rniga natija
-- saqlangan edi. lis.js endi ustunlarni sarlavha bo'yicha topadi. Bu yerda: noto'g'ri birliklarni tozalaymiz
-- va roziligi bor hamma foydalanuvchilarning yuborilgan blanklarini bot qayta o'qib, raqamlarni almashtiradi.
UPDATE lab_analytes SET unit = '';
INSERT INTO bot_jobs (kind, telegram_id) SELECT 'import', telegram_id FROM bot_users WHERE data_consent = true;
