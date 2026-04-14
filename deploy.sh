#!/usr/bin/env bash
set -euo pipefail

# Get absolute path to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create external networks if they don't exist
networks=(
    "backend_fuse-network"
    "notifications_notifications-network"
)

for network in "${networks[@]}"; do
    if ! docker network ls --format '{{.Name}}' | grep -q "^${network}$"; then
        echo "Creating network: $network"
        docker network create "$network"
    else
        echo "Network already exists: $network"
    fi
done

# Collect compose files — root nginx first, then services
compose_args=()

# Root nginx compose always goes first
if [[ -f "${PROJECT_ROOT}/docker-compose.prod.yaml" ]]; then
    compose_args+=("-f" "${PROJECT_ROOT}/docker-compose.prod.yaml")
fi

# Then all nested service compose files
while IFS= read -r -d '' file; do
    realpath_file="$(realpath "$file")"
    # Skip the root one — already added
    [[ "$realpath_file" == "$(realpath "${PROJECT_ROOT}/docker-compose.prod.yaml")" ]] && continue
    compose_args+=("-f" "$realpath_file")
done < <(find "${PROJECT_ROOT}" -mindepth 2 -name "docker-compose.prod.yaml" \
    -not -path "*/.git/*" \
    -print0 | sort -z)

if [[ ${#compose_args[@]} -eq 0 ]]; then
    echo "ERROR: No compose files found" >&2
    exit 1
fi

echo "Force removing stale containers..."
docker rm -f \
    redis-main \
    redis-notifications \
    backend-prod \
    notifications-prod \
    subscriptions-prod \
    frontend-prod \
    fuse-nginx-1 \
    auth_service \
    scheduler-worker \
    inapp-notifications-worker \
    2>/dev/null || true

echo "Pulling latest images..."
cd "${PROJECT_ROOT}"
docker compose "${compose_args[@]}" pull

echo "Starting containers..."
docker compose "${compose_args[@]}" up -d

echo "Cleaning up unused images..."
docker image prune -f

echo "Deploy complete"
