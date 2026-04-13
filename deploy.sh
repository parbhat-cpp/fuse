#!/usr/bin/env bash
set -euo pipefail

# Preserve values passed in from CI before .env can clobber them
_IMAGE_TAG="${IMAGE_TAG:-}"
_REGISTRY="${REGISTRY:-}"

# Load .env for everything else (DB URLs, app secrets, etc.)
set -o allexport
source .env
set +o allexport

# CI values always win over .env
IMAGE_TAG="${_IMAGE_TAG:-${IMAGE_TAG:-latest}}"
REGISTRY="${_REGISTRY:-${REGISTRY:-}}"

export IMAGE_TAG REGISTRY

echo "Deploying IMAGE_TAG=$IMAGE_TAG"

# Collect all prod compose files
compose_files=()
while IFS= read -r -d '' file; do
    compose_files+=("-f" "$(realpath "$file")")
done < <(find . -type f -name "docker-compose.prod.yaml" -print0)

if [[ ${#compose_files[@]} -eq 0 ]]; then
    echo "No docker-compose.prod.yaml files found" >&2
    exit 1
fi

echo "Pulling images..."
docker compose "${compose_files[@]}" pull

echo "Starting services..."
docker compose "${compose_files[@]}" up -d --remove-orphans
