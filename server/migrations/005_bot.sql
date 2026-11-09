-- Natijalar boti (Telegram). Bemor ismi, telefoni saqlanmaydi.
-- Laboratoriya kaliti (tmpK) — faqat shifrlangan holda (APP_SECRET), muddati o'tgach o'chiriladi.
-- Bot jadvallari alohida: kelajakda O'zbekistondagi serverga ko'chirish oson bo'lsin.

-- Saytdagi "Telegram'ga yuborish" tugmasi yaratgan bir martalik kalit: 15 daqiqa yashaydi,
-- birinchi /start dan keyin ishlatilgan hisoblanadi. Bazada kalitning o'zi emas, faqat sha256 izi.
CREATE TABLE bot_links (
  key_hash    text PRIMARY KEY,
  lis_id      text NOT NULL,
  lis_key     text,                      -- shifrlangan tmpK; ishlatilgach o'chiriladi
  lang        text NOT NULL DEFAULT 'uz',
  telegram_id bigint,
  used_at     timestamptz,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Botdan foydalanuvchilar: faqat Telegram ID, til va rozilik vaqti (ism, telefon yo'q)
CREATE TABLE bot_users (
  telegram_id bigint PRIMARY KEY,
  lang        text NOT NULL DEFAULT 'uz',
  consent_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Bitta Telegram bir nechta bemorni yuritishi mumkin (men / bola / ota-ona) — 4-bosqichda ishlatiladi
CREATE TABLE bot_patients (
  id          bigserial PRIMARY KEY,
  telegram_id bigint NOT NULL REFERENCES bot_users ON DELETE CASCADE,
  relation    text NOT NULL DEFAULT 'self',
  label       text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Bitta blank (kvitansiya) = bitta buyurtma. pending — hali tayyor emas, delivered — PDF yuborildi
CREATE TABLE bot_orders (
  id              bigserial PRIMARY KEY,
  telegram_id     bigint NOT NULL REFERENCES bot_users ON DELETE CASCADE,
  patient_id      bigint REFERENCES bot_patients ON DELETE SET NULL,
  lis_id          text NOT NULL,
  lis_key         text,                  -- shifrlangan tmpK; 30 kundan keyin o'chiriladi
  status          text NOT NULL DEFAULT 'pending',
  checks          integer NOT NULL DEFAULT 0,
  last_checked_at timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telegram_id, lis_id)
);
CREATE INDEX bot_orders_status_idx ON bot_orders (status, created_at);
