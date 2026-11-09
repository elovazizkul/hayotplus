-- Natijalar boti, 2-bosqich: natija tayyor bo'lishini bot o'zi tekshiradi va PDF ni o'zi yuboradi.
ALTER TABLE bot_orders
  ADD COLUMN next_check_at        timestamptz,  -- keyingi avtomatik tekshiruv (NULL — tekshirilmaydi)
  ADD COLUMN result_hash          text,         -- natijalar "izi" (sha256): o'zgarganini bilish uchun, raqam va ism emas
  ADD COLUMN operator_notified_at timestamptz;  -- "qolgan natijalarni operator yuboradi" xabari yuborilgan vaqt

CREATE INDEX bot_orders_next_check_idx ON bot_orders (next_check_at) WHERE next_check_at IS NOT NULL;

-- 1-bosqichda ulangan va hali kutilayotgan blanklar ham avtomatik tekshirilsin
UPDATE bot_orders SET next_check_at = now() WHERE status = 'pending' AND lis_key IS NOT NULL;
