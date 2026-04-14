#!/bin/bash
# Cron script per generare articoli automaticamente
# Da eseguire con crontab, ad esempio ogni 6 ore:
# 0 */6 * * * /path/to/scripts/generate-articles.sh

APP_URL="${APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-your-random-secret-here}"

echo "[$(date)] Avvio generazione articoli..."

response=$(curl -s -w "\n%{http_code}" -X POST "$APP_URL/api/generate" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "[$(date)] Successo: $body"
else
  echo "[$(date)] Errore ($http_code): $body"
fi
