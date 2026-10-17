#!/usr/bin/env bash
set -euo pipefail

# ORCA Database Restore Script
# Restores a pg_dump archive into PostgreSQL + PostGIS

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <path-to-backup-file.dump>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[!] WARNING: This will overwrite data in the 'orca' database."
echo "[*] Stopping API, worker and beat..."
docker compose -f /opt/orca/docker-compose.prod.yml stop api worker beat

echo "[*] Copying backup archive to db container..."
docker compose -f /opt/orca/docker-compose.prod.yml cp "${BACKUP_FILE}" db:/tmp/restore.dump

echo "[*] Restoring database using role orca_migrate..."
docker compose -f /opt/orca/docker-compose.prod.yml exec -T db pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --role=orca_migrate \
  -U orca_app \
  -d orca \
  /tmp/restore.dump || true

docker compose -f /opt/orca/docker-compose.prod.yml exec -T db rm /tmp/restore.dump

echo "[*] Running migration check..."
docker compose -f /opt/orca/docker-compose.prod.yml run --rm api python manage.py migrate --check

echo "[*] Restarting services..."
docker compose -f /opt/orca/docker-compose.prod.yml start api worker beat

echo "[+] Restore completed. Verifying health endpoint..."
curl -fsS http://localhost:8000/api/v1/health/ready/ || echo "[!] Check /health/ready/ status."
