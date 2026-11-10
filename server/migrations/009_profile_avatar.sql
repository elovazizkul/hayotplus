-- Mini App: profilga avatar (emoji) va rang — kimning tahlili ekanini ko'rib turish uchun.
-- Surat emas: odamlar suratini saqlamaymiz.
ALTER TABLE bot_patients
  ADD COLUMN avatar text,   -- src/data/avatars.js dagi ro'yxatdan; NULL — kimligi va jinsi bo'yicha
  ADD COLUMN color text;    -- blue | green | amber | pink | violet | teal; NULL — kimligi bo'yicha
