#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:?REGISTRY is not set}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is not set}"
PROJECT_PREFIX="${PROJECT_PREFIX:-fuse}"

to_image_name() {
    local rel="$1"
    local name
    name="${rel//\//-}"
    name="${name,,}"
    name="$(echo "$name" | sed -E 's/[^a-z0-9-]+/-/g; s/^-+//; s/-+$//')"
    echo "${PROJECT_PREFIX}-${name}"
}

# Discover all dirs with a Dockerfile.prod or Dockerfile
services=()
while IFS= read -r -d '' dockerfile; do
    dir="$(dirname "${dockerfile#./}")"
    services+=("$dir")
done < <(find . \( -name "Dockerfile.prod" -o -name "Dockerfile" \) \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -print0 | sort -z)

# Deduplicate — prefer Dockerfile.prod if both exist in same dir
declare -A seen=()
unique_services=()
for dir in "${services[@]}"; do
    if [[ -z "${seen[$dir]:-}" ]]; then
        seen["$dir"]=1
        unique_services+=("$dir")
    fi
done

for SERVICE_DIR in "${unique_services[@]}"; do
    # Prefer Dockerfile.prod, fall back to Dockerfile
    if [[ -f "${SERVICE_DIR}/Dockerfile.prod" ]]; then
        DOCKERFILE="${SERVICE_DIR}/Dockerfile.prod"
    else
        DOCKERFILE="${SERVICE_DIR}/Dockerfile"
    fi

    if ! grep -q "^FROM" "$DOCKERFILE"; then
        echo "SKIP: $DOCKERFILE is empty or invalid"
        continue
    fi

    IMAGE_NAME="$(to_image_name "$SERVICE_DIR")"
    SHA_TAG="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    LATEST_TAG="${REGISTRY}/${IMAGE_NAME}:latest"

    echo "Building $SERVICE_DIR -> $IMAGE_NAME"
    docker build -f "$DOCKERFILE" -t "$SHA_TAG" -t "$LATEST_TAG" "$SERVICE_DIR"

    echo "Pushing $IMAGE_NAME..."
    docker push "$SHA_TAG"
    docker push "$LATEST_TAG"
done

echo "All builds complete"
