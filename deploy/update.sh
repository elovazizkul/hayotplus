#!/usr/bin/env bash
# Saytni yangilash: GitHub'dan yangi kodni olib, qayta yig'adi va qayta ishga tushiradi.
# Serverda root sifatida:  bash /opt/hayotplus/deploy/update.sh
set -euo pipefail
APP_DIR="/opt/hayotplus"
APP_USER="hayot"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && git pull --ff-only && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund) && npm run build"
systemctl restart hayotplus
echo "Sayt yangilandi."
