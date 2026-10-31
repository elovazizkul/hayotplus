#!/usr/bin/env bash
# ============================================================
#  Hayot Plus sayti — Ubuntu serverni birinchi marta sozlash
# ============================================================
#  Ishga tushirish (root sifatida):
#     bash setup.sh                  — faqat IP orqali (HTTP)
#     bash setup.sh hayotplus.uz     — domen bilan + bepul HTTPS
#  Domen bilan ishlatishdan oldin domenning A-yozuvi server IP'siga
#  yo'naltirilgan bo'lishi kerak.
#  Skriptni qayta ishga tushirish xavfsiz (hech narsa buzilmaydi).
# ============================================================
set -euo pipefail

DOMAIN="${1:-}"
APP_USER="hayot"
APP_DIR="/opt/hayotplus"
REPO="https://github.com/elovazizkul/hayotplus.git"
ENV_FILE="/etc/hayotplus.env"

if [ "$(id -u)" -ne 0 ]; then echo "root sifatida ishga tushiring"; exit 1; fi

echo "==> Tizimni yangilash va kerakli dasturlar"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git nginx ufw ca-certificates gnupg unattended-upgrades

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "==> Node.js 20 o'rnatish"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Alohida foydalanuvchi (root'da ishlatmaymiz)"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"

echo "==> Sayt kodini yuklash va yig'ish"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund) && npm run build"

echo "==> Maxfiy sozlamalar fayli ($ENV_FILE)"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
# Maxfiy kalitlar. Qiymatlarni '=' dan keyin yozing, qo'shtirnoqsiz.
ANTHROPIC_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
# ixtiyoriy:
# ANTHROPIC_MODEL=claude-haiku-5-5
# LEAD_WEBHOOK_URL=
PORT=3000
EOF
fi
chown root:"$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

echo "==> Avtomatik ishga tushish (systemd)"
cp "$APP_DIR/deploy/hayotplus.service" /etc/systemd/system/hayotplus.service
systemctl daemon-reload
systemctl enable hayotplus
systemctl restart hayotplus

echo "==> Nginx"
SERVER_NAME="_"
if [ -n "$DOMAIN" ]; then SERVER_NAME="$DOMAIN www.$DOMAIN"; fi
sed "s/__SERVER_NAME__/$SERVER_NAME/" "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/hayotplus
ln -sf /etc/nginx/sites-available/hayotplus /etc/nginx/sites-enabled/hayotplus
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Xavfsizlik devori (faqat SSH, 80, 443)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

if [ -n "$DOMAIN" ]; then
  echo "==> Bepul HTTPS sertifikat (Let's Encrypt)"
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
fi

echo
echo "TAYYOR. Tekshiruv:"
curl -s -o /dev/null -w "  sayt javobi: %{http_code}\n" http://127.0.0.1:3000/
echo "Keyingi qadam: kalitlarni $ENV_FILE ga yozing, so'ng:  systemctl restart hayotplus"
