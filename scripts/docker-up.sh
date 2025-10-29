#!/usr/bin/env bash

set -euo pipefail

# remove existing containers with conflicting names, ignoring failures
for container in yoo-redis yoo-mysql kafka redpanda-console yoo-stack-app-1 app; do
  docker rm -f "$container" >/dev/null 2>&1 || true
done

docker compose -f docker/docker-compose.yml down --remove-orphans || true

BASE_PORT=${APP_PORT:-3000}
TARGET_PORT=$BASE_PORT

check_port_in_use() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -an | grep -E "LISTEN|tcp" | grep -q ":$port "
  else
    # fallback to attempting to bind via nc if available
    if command -v nc >/dev/null 2>&1; then
      nc -z localhost "$port" >/dev/null 2>&1
    else
      # assume free if no tooling
      return 1
    fi
  fi
}

while check_port_in_use "$TARGET_PORT"; do
  TARGET_PORT=$((TARGET_PORT + 1))
done

export APP_PORT=$TARGET_PORT

if [ "$TARGET_PORT" != "$BASE_PORT" ]; then
  echo "[docker-up] Port $BASE_PORT is busy. Using $TARGET_PORT for app service."
fi

MAX_ATTEMPTS=10
ATTEMPT=1

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
  set +e
  OUTPUT=$(docker compose -f docker/docker-compose.yml up -d 2>&1)
  STATUS=$?
  set -e

  if [ "$STATUS" -eq 0 ]; then
    echo "$OUTPUT"
    break
  fi

  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -qi "address already in use"; then
    TARGET_PORT=$((TARGET_PORT + 1))
    export APP_PORT=$TARGET_PORT
    echo "[docker-up] Detected port conflict. Retrying with port $TARGET_PORT (attempt $((ATTEMPT + 1)) of $MAX_ATTEMPTS)."
    docker compose -f docker/docker-compose.yml down --remove-orphans || true
    ATTEMPT=$((ATTEMPT + 1))
    continue
  fi

  echo "[docker-up] docker compose failed with status $STATUS" >&2
  exit $STATUS
done

if [ "$ATTEMPT" -gt "$MAX_ATTEMPTS" ]; then
  echo "[docker-up] Unable to find a free port after $MAX_ATTEMPTS attempts." >&2
  exit 1
fi
