#!/usr/bin/env bash
# Bazaning kunlik nusxasi: /var/backups/hayotplus (oxirgi 14 kun saqlanadi)
# Qayta tiklash: gunzip -c NUSXA.sql.gz | docker compose exec -T db psql -U hayotplus hayotplus
set -euo pipefail
DIR="/var/backups/hayotplus"
mkdir -p "$DIR"
chmod 700 "$DIR"
cd /opt/hayotplus
FILE="$DIR/hayotplus-$(date +%F).sql.gz"
docker compose exec -T db pg_dump -U hayotplus hayotplus | gzip > "$FILE"
chmod 600 "$FILE"
find "$DIR" -name 'hayotplus-*.sql.gz' -mtime +14 -delete
echo "$(date -Is) nusxa: $FILE"
