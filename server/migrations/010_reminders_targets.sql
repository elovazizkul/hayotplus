-- Natijalar boti, 4b-bosqich: qayta topshirish eslatmalari, shaxsiy maqsad, shifokor uchun PDF.

-- Ko'rsatkich bo'yicha eslatma muddati (egasi shifokor sifatida admin panelda belgilaydi), 0 — eslatma yo'q
ALTER TABLE lab_analytes ADD COLUMN remind_months integer NOT NULL DEFAULT 0;

-- Profil x ko'rsatkich: bemor eslatmani o'chirganmi, oxirgi eslatma qaysi tahlil sanasi uchun yuborilgan
CREATE TABLE patient_reminders (
  patient_id    bigint NOT NULL REFERENCES bot_patients ON DELETE CASCADE,
  analyte_id    bigint NOT NULL REFERENCES lab_analytes ON DELETE CASCADE,
  off           boolean NOT NULL DEFAULT false,
  last_sent_for date,                       -- shu sanadagi tahlil uchun eslatma ketgan (keyingi tahlilgacha qayta yuborilmaydi)
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, analyte_id)
);

-- Shaxsiy maqsad (shifokor aytgan): grafikda to'q sariq punktir
CREATE TABLE patient_targets (
  patient_id bigint NOT NULL REFERENCES bot_patients ON DELETE CASCADE,
  analyte_id bigint NOT NULL REFERENCES lab_analytes ON DELETE CASCADE,
  low        numeric,
  high       numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, analyte_id)
);

-- Botga topshiriq parametrlari ("Shifokorga ko'rsatish": profil, ko'rsatkichlar, davr)
ALTER TABLE bot_jobs ADD COLUMN payload jsonb;
