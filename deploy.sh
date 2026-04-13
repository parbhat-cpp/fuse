#!/usr/bin/env bash

# load env file
export $(grep -v '^#' .env | xargs)

# ensure IMAGE_TAG exists
export IMAGE_TAG=${IMAGE_TAG:-latest}

get_prod_compose_files() {
    local -n file_arr=$1

    while IFS= read -r -d '' file; do
        file_arr+=("$(realpath "$file")")
    done < <(find . -type f -name "docker-compose.prod.yaml" -print0)
}

compose_files=()
get_prod_compose_files compose_files

base_docker_compose_cmd="docker compose"
pull_cmd="$base_docker_compose_cmd"
up_cmd="$base_docker_compose_cmd"

for file in "${compose_files[@]}"; do
    pull_cmd+=" -f $file"
    up_cmd+=" -f $file"
done

pull_cmd+=" pull"
up_cmd+=" up -d --remove-orphans"

echo "Running Pull Command"
eval "IMAGE_TAG=$IMAGE_TAG $pull_cmd"

echo "Running: Up Command"
eval "IMAGE_TAG=$IMAGE_TAG $up_cmd"
