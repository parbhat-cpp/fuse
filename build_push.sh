#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:?REGISTRY is not set}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is not set}"

source "$(dirname "$0")/services.sh"

for SERVICE_DIR in "${!SERVICES[@]}"; do
    IMAGE_NAME="${SERVICES[$SERVICE_DIR]}"
    DOCKERFILE=""

    # Find Dockerfile.prod or Dockerfile
    if [[ -f "${SERVICE_DIR}/Dockerfile.prod" ]]; then
        DOCKERFILE="${SERVICE_DIR}/Dockerfile.prod"
    elif [[ -f "${SERVICE_DIR}/Dockerfile" ]]; then
        DOCKERFILE="${SERVICE_DIR}/Dockerfile"
    else
        echo "SKIP: no Dockerfile found in $SERVICE_DIR"
        continue
    fi

    if ! grep -q "^FROM" "$DOCKERFILE"; then
        echo "SKIP: $DOCKERFILE is empty or invalid"
        continue
    fi

    SHA_TAG="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    LATEST_TAG="${REGISTRY}/${IMAGE_NAME}:latest"

    echo "Building $SERVICE_DIR -> $IMAGE_NAME"
    docker build -f "$DOCKERFILE" -t "$SHA_TAG" -t "$LATEST_TAG" "$SERVICE_DIR"

    echo "Pushing $IMAGE_NAME..."
    docker push "$SHA_TAG"
    docker push "$LATEST_TAG"
done

echo "All builds complete"
