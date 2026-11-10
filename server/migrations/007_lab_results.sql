-- Natijalar boti, 3-bosqich: tahlil raqamlari bazaga (dinamika grafiklari uchun).
-- Bemor ismi saqlanmaydi. Raqamlar faqat alohida roziligi bo'lsa saqlanadi va bemor
-- "Ma'lumotlarimni o'chirish" buyrug'i bilan hammasini o'chira oladi.

-- Raqamlarni saqlashga rozilik: NULL — hali so'ralmagan, true / false — javob
ALTER TABLE bot_users ADD COLUMN data_consent boolean;

-- "Bu kimning tahlili?": profilga tug'ilgan yil (keyingi blankda taxmin qilish uchun)
ALTER TABLE bot_patients ADD COLUMN birth_year integer;
ALTER TABLE bot_orders
  ADD COLUMN birth_year integer,                 -- blankdagi tug'ilgan yil (profilni taxmin qilish uchun)
  ADD COLUMN profile_asked_at timestamptz;       -- "kimning tahlili?" so'ralgan vaqt

-- Ko'rsatkichlar ma'lumotnomasi: laboratoriya dasturi yozgan nom bo'yicha avtomatik to'ladi.
-- Narxlar ro'yxati (tests) emas: narxda "Umumiy qon tahlili" — 1 qator, blankda esa 20+ ko'rsatkich.
CREATE TABLE lab_analytes (
  id          bigserial PRIMARY KEY,
  lis_name    text NOT NULL,                     -- ToDevelop blankidagi nom
  group_title text NOT NULL DEFAULT '',          -- guruh: qondagi va siydikdagi "Glyukoza" — har xil ko'rsatkich
  name_uz     text NOT NULL DEFAULT '',          -- grafik uchun qisqa nom (egasi yozadi)
  name_ru     text NOT NULL DEFAULT '',
  unit        text NOT NULL DEFAULT '',
  outsourced  boolean NOT NULL DEFAULT false,    -- "Autsors — operator yuboradi"
  merged_into bigint NOT NULL DEFAULT 0,         -- 0 — o'zi; boshqa № — shu ko'rsatkich bilan bir xil
  seen_count  integer NOT NULL DEFAULT 0,
  first_seen  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lis_name, group_title)
);

-- Raqamlar: bir blank = bir nechta qator. Blank o'chirilsa — raqamlari ham o'chadi.
-- Kimniki ekani bot_orders.patient_id orqali (profil keyin o'zgarsa ham shu yerni tegmaymiz).
CREATE TABLE lab_results (
  id          bigserial PRIMARY KEY,
  order_id    bigint NOT NULL REFERENCES bot_orders ON DELETE CASCADE,
  analyte_id  bigint NOT NULL REFERENCES lab_analytes,
  value_text  text NOT NULL,                     -- blankda qanday yozilgan bo'lsa ("18,6", "<0.5", "manfiy")
  value_num   numeric,                           -- oddiy son bo'lsa (18.6), aks holda NULL
  unit        text NOT NULL DEFAULT '',
  ref_text    text NOT NULL DEFAULT '',          -- me'yor matni ("Муж < 42, Жен < 32")
  ref_low     numeric,
  ref_high    numeric,
  measured_on date,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lab_results_order_idx ON lab_results (order_id);
CREATE INDEX lab_results_analyte_idx ON lab_results (analyte_id, measured_on);

-- Sahifani o'qish jurnali: parser buzilmaganini nazorat qilish (kechki hisobot). Ism, raqam yo'q.
CREATE TABLE parse_log (
  id           bigserial PRIMARY KEY,
  order_id     bigint,
  outcome      text NOT NULL,                    -- ready | not_found
  rows_parsed  integer NOT NULL DEFAULT 0,
  rows_saved   integer NOT NULL DEFAULT 0,
  new_analytes integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX parse_log_created_idx ON parse_log (created_at);
