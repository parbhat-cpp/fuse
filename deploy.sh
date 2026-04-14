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

# Collect compose files
root_compose_file="${PROJECT_ROOT}/docker-compose.prod.yaml"
service_compose_files=()

while IFS= read -r -d '' file; do
    service_compose_files+=("$(realpath "$file")")
done < <(find "${PROJECT_ROOT}" -mindepth 2 -name "docker-compose.prod.yaml" \
    -not -path "*/.git/*" \
    -print0 | sort -z)

if [[ ${#service_compose_files[@]} -eq 0 && ! -f "${root_compose_file}" ]]; then
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
for compose_file in "${service_compose_files[@]}"; do
    compose_dir="$(dirname "${compose_file}")"
    compose_name="$(basename "${compose_file}")"
    echo "Pulling: ${compose_file}"
    (
        cd "${compose_dir}"
        docker compose -f "${compose_name}" pull
    )
done

if [[ -f "${root_compose_file}" ]]; then
    echo "Pulling: ${root_compose_file}"
    (
        cd "${PROJECT_ROOT}"
        docker compose -f "$(basename "${root_compose_file}")" pull
    )
fi

echo "Starting containers..."
for compose_file in "${service_compose_files[@]}"; do
    compose_dir="$(dirname "${compose_file}")"
    compose_name="$(basename "${compose_file}")"
    echo "Starting: ${compose_file}"
    (
        cd "${compose_dir}"
        docker compose -f "${compose_name}" up -d
    )
done

if [[ -f "${root_compose_file}" ]]; then
    echo "Starting: ${root_compose_file}"
    (
        cd "${PROJECT_ROOT}"
        docker compose -f "$(basename "${root_compose_file}")" up -d
    )
fi

echo "Cleaning up unused images..."
docker image prune -f

echo "Deploy complete"
