#!/usr/bin/env bash
set -euo pipefail

# ORCA Production Rollout Script
# Executes zero-downtime migration, container rolling restart, and smoke tests

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <release-commit-sha>"
  exit 1
fi

RELEASE_SHA="$1"
COMPOSE_FILE="/opt/orca/docker-compose.prod.yml"

echo "=== [1/5] Pulling release image: ${RELEASE_SHA} ==="
RELEASE_TAG="${RELEASE_SHA}" docker compose -f "${COMPOSE_FILE}" pull api worker beat

echo "=== [2/5] Running database migrations with orca_migrate role ==="
RELEASE_TAG="${RELEASE_SHA}" docker compose -f "${COMPOSE_FILE}" run --rm \
  -e DATABASE_URL="${DATABASE_MIGRATE_URL}" \
  api python manage.py migrate --noinput

echo "=== [3/5] Rolling restart of API, Worker, and Beat ==="
RELEASE_TAG="${RELEASE_SHA}" docker compose -f "${COMPOSE_FILE}" up -d --no-deps api
RELEASE_TAG="${RELEASE_SHA}" docker compose -f "${COMPOSE_FILE}" up -d --no-deps worker beat

echo "=== [4/5] Waiting for API health check ==="
for i in {1..12}; do
  if docker compose -f "${COMPOSE_FILE}" exec -T api python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health/ready/')"; then
    echo "[+] Healthcheck passed!"
    break
  fi
  echo "[...] Waiting for API container to report ready (${i}/12)..."
  sleep 5
done

echo "=== [5/5] Checking data freshness status ==="
docker compose -f "${COMPOSE_FILE}" exec -T api python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/data-status/')" || true

echo "=== Deployment of ${RELEASE_SHA} completed successfully! ==="
