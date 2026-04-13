#!/usr/bin/env bash
set -euo pipefail

# All dirs that have a docker-compose.prod.yaml (these are all deployable services)
all_service_dirs=()
while IFS= read -r -d '' file; do
    dir="$(dirname "${file#./}")"
    all_service_dirs+=("$dir")
done < <(find . -name "docker-compose.prod.yaml" \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -print0)

echo "All deployable services: ${all_service_dirs[*]}"

# Of those, which ones have a Dockerfile.prod (buildable)
buildable_dirs=()
for dir in "${all_service_dirs[@]}"; do
    if [[ -f "${dir}/Dockerfile.prod" ]]; then
        buildable_dirs+=("$dir")
    fi
done

echo "Buildable services: ${buildable_dirs[*]}"

# Get changed files in this push
# On first commit, diff against empty tree
if git rev-parse HEAD~1 > /dev/null 2>&1; then
    changed_files="$(git diff --name-only HEAD~1 HEAD)"
else
    changed_files="$(git diff --name-only $(git hash-object -t tree /dev/null) HEAD)"
fi

echo "Changed files:"
echo "$changed_files"

# Which buildable services have changed files?
services_to_build=()
for dir in "${buildable_dirs[@]}"; do
    # root dir "." is a special case
    if [[ "$dir" == "." ]]; then
        pattern="^[^/]+$"
    else
        pattern="^${dir}/"
    fi

    if echo "$changed_files" | grep -qE "$pattern"; then
        services_to_build+=("$dir")
        echo "  -> $dir queued for build"
    fi
done

# Does anything need deploying? (any change to any service dir)
needs_deploy=false
for dir in "${all_service_dirs[@]}"; do
    if [[ "$dir" == "." ]]; then
        pattern="^[^/]+$"
    else
        pattern="^${dir}/"
    fi
    if echo "$changed_files" | grep -qE "$pattern"; then
        needs_deploy=true
        break
    fi
done

if [[ ${#services_to_build[@]} -eq 0 ]]; then
    echo "No buildable services changed"
    echo "services_to_build=[]" >> "$GITHUB_OUTPUT"
    echo "has_builds=false"     >> "$GITHUB_OUTPUT"
else
    json="$(printf '%s\n' "${services_to_build[@]}" | jq -R . | jq -sc .)"
    echo "services_to_build=$json" >> "$GITHUB_OUTPUT"
    echo "has_builds=true"         >> "$GITHUB_OUTPUT"
fi

echo "needs_deploy=$needs_deploy" >> "$GITHUB_OUTPUT"
