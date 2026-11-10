-- Natijalar boti, 4-bosqich: Telegram Mini App "Mening tahlillarim".

-- Profil jinsi: "Муж < 42, Жен < 32" kabi me'yorni tanlash uchun (Mini App bir marta so'raydi)
ALTER TABLE bot_patients ADD COLUMN sex text;   -- 'm' | 'f' | NULL

-- Tanlangan ko'rsatkichlar (★ ro'yxat tepasida)
CREATE TABLE patient_favorites (
  patient_id bigint NOT NULL REFERENCES bot_patients ON DELETE CASCADE,
  analyte_id bigint NOT NULL REFERENCES lab_analytes ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, analyte_id)
);

-- Mini App'dan botga topshiriqlar: PDF ni chatga yuborish, raqamlarni import qilish.
-- PDF faqat bot konteynerida (Chromium) tayyorlanadi, shuning uchun sayt topshiriqni shu yerga yozadi.
CREATE TABLE bot_jobs (
  id          bigserial PRIMARY KEY,
  kind        text NOT NULL,                  -- send_pdf | import
  telegram_id bigint NOT NULL REFERENCES bot_users ON DELETE CASCADE,
  order_id    bigint REFERENCES bot_orders ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  done_at     timestamptz,
  error       text
);
CREATE INDEX bot_jobs_todo_idx ON bot_jobs (id) WHERE done_at IS NULL;
