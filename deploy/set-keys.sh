#!/usr/bin/env bash
# Maxfiy kalitlarni /etc/hayotplus.env ga yozadi. Kiritilgan qiymatlar ekranda ko'rinmaydi.
# Bo'sh qoldirilsa — eski qiymat saqlanadi.
# Ishga tushirish (serverda root sifatida):  bash /opt/hayotplus/deploy/set-keys.sh
set -euo pipefail
ENV_FILE="/etc/hayotplus.env"
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE topilmadi — avval setup.sh ni ishga tushiring"; exit 1; }

set_var() {
  local name="$1" prompt="$2" value
  read -rsp "$prompt (Enter — o'zgartirmaslik): " value
  echo
  value="$(printf '%s' "$value" | tr -d '[:space:]\r\n')"
  if [ -z "$value" ]; then echo "  $name: o'zgarmadi"; return; fi
  local tmp
  tmp="$(mktemp)"
  grep -v "^${name}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$name" "$value" >> "$tmp"
  cat "$tmp" > "$ENV_FILE"
  rm -f "$tmp"
  echo "  $name: saqlandi (${#value} belgi)"
}

echo "Qiymatni Vercel'dan nusxalab, shu yerga qo'ying (o'ng tugma) va Enter bosing."
set_var ANTHROPIC_API_KEY  "1/3 ANTHROPIC_API_KEY"
set_var TELEGRAM_BOT_TOKEN "2/3 TELEGRAM_BOT_TOKEN"
set_var TELEGRAM_CHAT_ID   "3/3 TELEGRAM_CHAT_ID"

chown root:hayot "$ENV_FILE"
chmod 640 "$ENV_FILE"
systemctl restart hayotplus
sleep 1
echo
echo "Sayt qayta ishga tushirildi: $(systemctl is-active hayotplus)"
echo "Sozlangan kalitlar:"
for n in ANTHROPIC_API_KEY TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do
  if grep -q "^${n}=.\+" "$ENV_FILE"; then echo "  $n: BOR"; else echo "  $n: YO'Q"; fi
done
