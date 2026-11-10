-- Bemor eslatmani o'zi qo'yadi: qaysi ko'rsatkich, qaysi profil (masalan, "Onam"), necha oyda.
-- months NULL — laboratoriya tavsiyasi (lab_analytes.remind_months) ishlatiladi.
ALTER TABLE patient_reminders ADD COLUMN months integer CHECK (months IS NULL OR months BETWEEN 1 AND 36);

-- Egasi misoli: glikirlangan gemoglobin (HbA1c) — har 3 oyda. Boshqa muddatlarni egasi admin panelda belgilaydi.
UPDATE lab_analytes SET remind_months = 3
WHERE remind_months = 0 AND (lis_name ILIKE '%гликир%' OR lis_name ILIKE '%HbA1c%');
