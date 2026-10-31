#!/usr/bin/env bash
# ============================================================
#  Hayot Plus — serverga o'rnatish va yangilash (Ubuntu, root)
# ============================================================
#  Birinchi marta ham, keyingi yangilashlarda ham shu skript:
#     bash /opt/hayotplus/deploy/deploy.sh
#  - Docker bo'lmasa o'rnatadi
#  - GitHub'dan yangi kodni oladi
#  - .env yo'q bo'lsa, tasodifiy parollar bilan yaratadi
#  - eski (Dockersiz) o'rnatishni to'xtatadi
#  - saytni qayta yig'ib ishga tushiradi
#  Baza Docker volume'da turadi: qayta ishga tushirishda o'chmaydi.
# ============================================================
set -euo pipefail

APP_DIR="/opt/hayotplus"
REPO="https://github.com/elovazizkul/hayotplus.git"
IP="37.60.236.217"
DOMAIN="hayotplus.uz"
PASSWORD_FILE="/root/hayotplus-admin-password.txt"

if [ "$(id -u)" -ne 0 ]; then echo "root sifatida ishga tushiring"; exit 1; fi

if ! command -v docker >/dev/null; then
  echo "==> Docker o'rnatilmoqda"
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Kod yangilanmoqda"
if [ -d "$APP_DIR/.git" ]; then
  chown -R root:root "$APP_DIR"
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "==> .env yaratilmoqda"
  ADMIN_PASSWORD="$(openssl rand -hex 12)"
  umask 077
  cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
APP_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$ADMIN_PASSWORD
SITE_ADDRESS=http://$IP, $DOMAIN, www.$DOMAIN
EOF
  echo "$ADMIN_PASSWORD" > "$PASSWORD_FILE"
  chmod 600 .env "$PASSWORD_FILE"
fi

# Eski o'rnatish 80-portni band qiladi
for svc in hayotplus nginx; do
  if systemctl is-active --quiet "$svc" || systemctl is-enabled --quiet "$svc" 2>/dev/null; then
    echo "==> $svc to'xtatilmoqda"
    systemctl disable --now "$svc" || true
  fi
done

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443 >/dev/null
fi

echo "==> Sayt yig'ilmoqda va ishga tushirilmoqda"
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

cat > /etc/cron.d/hayotplus-backup <<EOF
30 3 * * * root bash $APP_DIR/deploy/backup.sh >> /var/log/hayotplus-backup.log 2>&1
EOF

echo "==> Tekshiruv"
for _ in $(seq 1 30); do
  if docker compose exec -T app wget -qO- http://127.0.0.1:3000/healthz >/dev/null 2>&1; then
    echo "TAYYOR: sayt ishlayapti. Admin panel: /admin"
    [ -f "$PASSWORD_FILE" ] && echo "Birinchi parol shu faylda: $PASSWORD_FILE"
    exit 0
  fi
  sleep 2
done
echo "XATO: sayt javob bermadi. Loglar: docker compose logs app"
exit 1
