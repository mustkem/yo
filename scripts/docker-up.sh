#!/usr/bin/env bash

set -euo pipefail

# remove existing containers with conflicting names, ignoring failures
for container in yoo-redis yoo-mysql kafka redpanda-console redisinsight yoo-stack-app-1 app; do
  docker rm -f "$container" >/dev/null 2>&1 || true
done

docker compose -f docker/docker-compose.yml down --remove-orphans || true

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

allocate_port() {
  local var_name=$1
  local default_value=$2
  local description=$3

  local base_value=$default_value
  if [ -n "${!var_name:-}" ]; then
    base_value=${!var_name}
  fi

  local target_value=$base_value
  while check_port_in_use "$target_value"; do
    target_value=$((target_value + 1))
  done

  export "$var_name"="$target_value"

  if [ "$target_value" != "$base_value" ]; then
    echo "[docker-up] Port $base_value is busy. Using $target_value for $description."
  fi
}

PORT_MAPPINGS=(
  "APP_PORT|3000|app service"
  "HOST_MYSQL_PORT|3306|mysql service"
  "HOST_KAFKA_PORT|9092|kafka service"
  "HOST_REDPANDA_CONSOLE_PORT|8080|redpanda console"
  "HOST_REDIS_PORT|6379|redis service"
  "HOST_REDISINSIGHT_PORT|8001|redis insight"
  "HOST_ELASTIC_HTTP_PORT|9200|elasticsearch http"
  "HOST_ELASTIC_TRANSPORT_PORT|9300|elasticsearch transport"
  "HOST_KIBANA_PORT|5601|kibana service"
)

for mapping in "${PORT_MAPPINGS[@]}"; do
  IFS="|" read -r var default desc <<<"$mapping"
  allocate_port "$var" "$default" "$desc"
done

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
    for mapping in "${PORT_MAPPINGS[@]}"; do
      IFS="|" read -r var default desc <<<"$mapping"
      allocate_port "$var" "$default" "$desc"
    done
    echo "[docker-up] Detected port conflict. Retrying (attempt $((ATTEMPT + 1)) of $MAX_ATTEMPTS)."
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
