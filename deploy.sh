#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/services.sh"

compose_args=()

for SERVICE_DIR in "${!SERVICES[@]}"; do
    if [[ "$SERVICE_DIR" == "." ]]; then
        COMPOSE_FILE="./docker-compose.prod.yaml"
    else
        COMPOSE_FILE="./${SERVICE_DIR}/docker-compose.prod.yaml"
    fi

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        echo "SKIP: no compose file found for $SERVICE_DIR"
        continue
    fi

    compose_args+=("-f" "$(realpath "$COMPOSE_FILE")")
done

if [[ ${#compose_args[@]} -eq 0 ]]; then
    echo "ERROR: No compose files found" >&2
    exit 1
fi

echo "Deploying ${#compose_args[@]} service(s)..."

docker compose "${compose_args[@]}" pull
docker compose "${compose_args[@]}" up -d --remove-orphans

echo "Deploy complete"
