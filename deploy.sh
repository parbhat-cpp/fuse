#!/usr/bin/env bash
set -euo pipefail

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
if [[ -f "./docker-compose.prod.yaml" ]]; then
    compose_args+=("-f" "$(realpath ./docker-compose.prod.yaml)")
fi

# Then all nested service compose files
while IFS= read -r -d '' file; do
    realpath_file="$(realpath "$file")"
    # Skip the root one — already added
    [[ "$realpath_file" == "$(realpath ./docker-compose.prod.yaml)" ]] && continue
    compose_args+=("-f" "$realpath_file")
done < <(find . -mindepth 2 -name "docker-compose.prod.yaml" \
    -not -path "./.git/*" \
    -print0 | sort -z)

if [[ ${#compose_args[@]} -eq 0 ]]; then
    echo "ERROR: No docker-compose.prod.yaml files found" >&2
    exit 1
fi

echo "Deploying with ${#compose_args[@]} compose file(s)..."

docker compose "${compose_args[@]}" down
docker compose "${compose_args[@]}" pull
docker compose "${compose_args[@]}" up -d --remove-orphans

echo "Deploy complete"
