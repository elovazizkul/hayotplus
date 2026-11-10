-- "Kuzatuv" (kuzatuvdagi ko'rsatkichlar) — "Tanlanganlar" o'rniga. patient_favorites jadvali shu ma'noda ishlatiladi.
-- off = true — bemor ko'rsatkichni kuzatuvdan o'zi olib tashlagan (avtomatik qo'shilgan bo'lsa ham qaytmaydi).
ALTER TABLE patient_favorites ADD COLUMN off boolean NOT NULL DEFAULT false;

-- Admin panel: shu ko'rsatkich profilda paydo bo'lishi bilan kuzatuvga o'zi qo'shilsin (egasi belgilaydi)
ALTER TABLE lab_analytes ADD COLUMN auto_watch boolean NOT NULL DEFAULT false;
