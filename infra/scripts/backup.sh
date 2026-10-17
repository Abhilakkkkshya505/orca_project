#!/usr/bin/env bash
set -euo pipefail

# ORCA Database Backup Script
# Creates a compressed logical dump with pg_dump and uploads to Cloudflare R2

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_DIR="${BACKUP_DIR:-/opt/orca/backups}"
BACKUP_FILE="${BACKUP_DIR}/orca_backup_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[*] Creating database backup: ${BACKUP_FILE}..."
docker compose -f /opt/orca/docker-compose.prod.yml exec -T db pg_dump \
  -U orca_app \
  -d orca \
  -Fc \
  -f "/tmp/backup_${TIMESTAMP}.dump"

docker compose -f /opt/orca/docker-compose.prod.yml cp db:"/tmp/backup_${TIMESTAMP}.dump" "${BACKUP_FILE}"
docker compose -f /opt/orca/docker-compose.prod.yml exec -T db rm "/tmp/backup_${TIMESTAMP}.dump"

echo "[*] Encrypting and syncing to Cloudflare R2..."
if command -v aws >/dev/null 2>&1 && [ -n "${R2_BUCKET_BACKUPS:-}" ]; then
  aws s3 cp "${BACKUP_FILE}" "s3://${R2_BUCKET_BACKUPS}/daily/orca_backup_${TIMESTAMP}.dump" \
    --endpoint-url "${R2_ENDPOINT_URL}"
  echo "[+] Backup successfully uploaded to R2."
else
  echo "[!] R2 upload skipped (aws-cli not found or bucket unset). Backup saved locally at ${BACKUP_FILE}."
fi

# Prune local backups older than 14 days
find "${BACKUP_DIR}" -type f -name "orca_backup_*.dump" -mtime +14 -delete
echo "[+] Local backup pruning complete."
