#!/usr/bin/env bash
set -euo pipefail
set -m

cd "$(dirname "$0")/../.."
if ! docker info >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo 'Docker with Compose must be installed and running for test:all.' >&2
  exit 1
fi

directory=$(mktemp -d "${TMPDIR:-/tmp}/cityborn-tests.XXXXXXXX")
project=$(basename "$directory" | tr '[:upper:].' '[:lower:]-')
export TEST_DOCKER_RUN_ID="$project"
child=''
compose() {
  docker compose -p "$project" -f scripts/tests/compose.yml "$@"
}
cleanup() {
  status=$?
  trap - EXIT
  trap '' INT TERM
  if [[ -n "$child" ]]; then
    kill -TERM -- "-$child" 2>/dev/null || true
    sleep 1
    kill -KILL -- "-$child" 2>/dev/null || true
    wait "$child" 2>/dev/null || true
  fi
  containers=$(docker ps -aq --filter "label=cityborn.test-run=$TEST_DOCKER_RUN_ID") || status=1
  while IFS= read -r container; do
    [[ -z "$container" ]] || docker rm -fv "$container" || status=1
  done <<< "$containers"
  compose down --volumes --remove-orphans || status=1
  rmdir "$directory"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
run() {
  "$@" &
  child=$!
  wait "$child"
  child=''
}

run pnpm test
run compose up -d --wait --wait-timeout 90
database_address=$(compose port postgres 5432)
redis_address=$(compose port redis 6379)
export TEST_DATABASE_URL="postgresql://cityborn_test:cityborn_test@$database_address/cityborn_test"
export TEST_REDIS_URL="redis://$redis_address/0"
run pnpm --dir apps/backend test:int
run pnpm --dir apps/backend test:e2e
