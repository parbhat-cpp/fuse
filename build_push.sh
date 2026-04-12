#!/usr/bin/env bash

set -e

REGISTRY="${REGISTRY:-myregistry.azurecr.io}"
PROJECT_PREFIX="${PROJECT_PREFIX:-fuse}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DRY_RUN="${DRY_RUN:-true}"

declare -A service_dockerfile_map=()
services=()

is_excluded() {
    local path="$1"

    [[ "$path" == ./cli/* ]] && return 0
    [[ "$path" == ./.git/* ]] && return 0
    [[ "$path" == ./node_modules/* ]] && return 0

    return 1
}

to_repo_name() {
    local rel_path="$1"
    local normalized

    # workers/rooms/scheduler-worker -> workers-rooms-scheduler-worker
    normalized="${rel_path//\//-}"
    normalized="${normalized,,}"             # lowercase
    normalized="${normalized//[_ ]/-}"       # underscores/spaces -> dash
    normalized="$(echo "$normalized" | sed -E 's/[^a-z0-9.-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"

    echo "${PROJECT_PREFIX}-${normalized}"
}

discover_services() {
    local -n out_services=$1
    local -n out_map=$2

    while IFS= read -r -d '' dockerfile; do
        if is_excluded "$dockerfile"; then
            continue
        fi

        local service_dir
        service_dir="$(dirname "$dockerfile")"

        # keep relative format without leading ./
        service_dir="${service_dir#./}"

        # prefer Dockerfile.prod over Dockerfile
        if [[ -n "${out_map[$service_dir]:-}" ]]; then
            if [[ "${out_map[$service_dir]}" == *"/Dockerfile.prod" ]]; then
                continue
            fi
            if [[ "$dockerfile" == *"/Dockerfile.prod" ]]; then
                out_map["$service_dir"]="$dockerfile"
            fi
        else
            out_services+=("$service_dir")
            out_map["$service_dir"]="$dockerfile"
        fi
    done < <(find . -type f \( -name "Dockerfile.prod" -o -name "Dockerfile" \) -print0)
}

discover_services services service_dockerfile_map

echo "Total services discovered: ${#services[@]}"

for service in "${services[@]}"; do
    dockerfile_path="${service_dockerfile_map[$service]}"
    image_repo="$(to_repo_name "$service")"
    image="${REGISTRY}/${image_repo}:${IMAGE_TAG}"

    echo "🚀 Service: $service"
    echo "   Dockerfile: $dockerfile_path"
    echo "   Image: $image"

    if [[ "$DRY_RUN" == "true" ]]; then
        continue
    fi

    docker build -f "$dockerfile_path" -t "$image" "$service"
    docker push "$image"
done
