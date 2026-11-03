-- QR orqali olingan tahlil natijalarining AI izohlari.
-- Bemor ismi saqlanmaydi: faqat blank raqami, jinsi, yoshi, ko'rsatkichlar va AI javobi.
-- 90 kundan eskilari server tomonidan avtomatik o'chiriladi.
CREATE TABLE interpretations (
  id          bigserial PRIMARY KEY,
  lis_id      text NOT NULL DEFAULT '',
  sex         text NOT NULL,
  age         integer,
  lang        text NOT NULL DEFAULT 'ru',
  specialty   text NOT NULL DEFAULT '',
  urgency     text NOT NULL DEFAULT '',
  results     jsonb NOT NULL,
  answer      jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX interpretations_created_idx ON interpretations (created_at DESC);
CREATE INDEX interpretations_lis_idx ON interpretations (lis_id);
