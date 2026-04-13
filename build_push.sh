#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-myregistry.azurecr.io}"
PROJECT_PREFIX="${PROJECT_PREFIX:-fuse}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DRY_RUN="${DRY_RUN:-false}"   # default false — actually build in CI

echo "Registry:  $REGISTRY"
echo "Tag:       $IMAGE_TAG"
echo "Dry run:   $DRY_RUN"

is_excluded() {
    local path="$1"
    [[ "$path" == ./cli/* ]]          && return 0
    [[ "$path" == ./.git/* ]]         && return 0
    [[ "$path" == ./node_modules/* ]] && return 0
    return 1
}

to_repo_name() {
    local rel="$1"
    local name
    name="${rel//\//-}"
    name="${name,,}"
    name="${name//[_ ]/-}"
    name="$(echo "$name" | sed -E 's/[^a-z0-9.-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"
    echo "${PROJECT_PREFIX}-${name}"
}

declare -A service_dockerfile_map=()
services=()

while IFS= read -r -d '' dockerfile; do
    is_excluded "$dockerfile" && continue

    service_dir="$(dirname "$dockerfile")"
    service_dir="${service_dir#./}"

    if [[ -n "${service_dockerfile_map[$service_dir]:-}" ]]; then
        # Prefer Dockerfile.prod over Dockerfile
        [[ "${service_dockerfile_map[$service_dir]}" == *"Dockerfile.prod" ]] && continue
        [[ "$dockerfile" == *"Dockerfile.prod" ]] && service_dockerfile_map["$service_dir"]="$dockerfile"
    else
        services+=("$service_dir")
        service_dockerfile_map["$service_dir"]="$dockerfile"
    fi
done < <(find . -type f \( -name "Dockerfile.prod" -o -name "Dockerfile" \) -print0)

echo "Services discovered: ${#services[@]}"

for service in "${services[@]}"; do
    dockerfile="${service_dockerfile_map[$service]}"
    image="${REGISTRY}/$(to_repo_name "$service"):${IMAGE_TAG}"

    echo "  [$service] -> $image"

    [[ "$DRY_RUN" == "true" ]] && continue

    docker build -f "$dockerfile" -t "$image" "$service"
    docker push "$image"
done
