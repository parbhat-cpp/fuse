#!/usr/bin/env bash
set -euo pipefail

SERVICE_DIR="${1:?Usage: build_push.sh <service-dir>}"
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

DOCKERFILE="${SERVICE_DIR}/Dockerfile.prod"

if [[ ! -f "$DOCKERFILE" ]]; then
    echo "ERROR: $DOCKERFILE not found" >&2
    exit 1
fi

if ! grep -q "^FROM" "$DOCKERFILE"; then
    echo "ERROR: $DOCKERFILE is empty or invalid" >&2
    exit 1
fi

IMAGE_NAME="$(to_image_name "$SERVICE_DIR")"
SHA_TAG="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_TAG="${REGISTRY}/${IMAGE_NAME}:latest"

echo "Building $SERVICE_DIR"
echo "  -> $SHA_TAG"
docker build -f "$DOCKERFILE" -t "$SHA_TAG" -t "$LATEST_TAG" "$SERVICE_DIR"

echo "Pushing images..."
docker push "$SHA_TAG"
docker push "$LATEST_TAG"
