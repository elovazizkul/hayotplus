-- Sayt statistikasi: kunlik hisoblagichlar (Toshkent vaqti bo'yicha).
-- Tashrif buyuruvchi saqlanmaydi: noyoblik uchun faqat kunlik shifrlangan iz (IP va brauzerdan), u 2 kundan keyin o'chiriladi.
CREATE TABLE daily_stats (
  day     date NOT NULL,
  metric  text NOT NULL,
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric)
);

CREATE TABLE visit_marks (
  day    date NOT NULL,
  scope  text NOT NULL,
  mark   text NOT NULL,
  PRIMARY KEY (day, scope, mark)
);
