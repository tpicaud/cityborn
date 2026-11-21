#!/usr/bin/env bash
set -euo pipefail

DEV_ENV_SLOT_FILE=".cityborn-slot"
DEV_ENV_MAX_SLOT=9
DEV_ENV_BACKEND_PORT=4000
DEV_ENV_FRONTEND_PORT=3000
DEV_ENV_BACK_OFFICE_PORT=3001
DEV_ENV_METRO_PORT=8081
DEV_ENV_POSTGRES_PORT=5432
DEV_ENV_REDIS_PORT=6379

dev_env_main_root() {
  git -C "$1" worktree list --porcelain | awk '/^worktree / {print substr($0, 10); exit}'
}

dev_env_host_id() {
  cat /etc/machine-id 2>/dev/null || hostname
}

dev_env_project() {
  echo "cityborn-slot-$1"
}

dev_env_port() {
  echo $(($1 + 10 * $2))
}

dev_env_read_slot() {
  local checkout="$1" slot
  if [ "$checkout" = "$(dev_env_main_root "$checkout")" ]; then
    echo 0
    return
  fi
  [ -f "$checkout/$DEV_ENV_SLOT_FILE" ] || return 0
  slot="$(tr -d '[:space:]' < "$checkout/$DEV_ENV_SLOT_FILE")"
  if [[ "$slot" =~ ^[1-9][0-9]*$ ]] && [ "$slot" -le "$DEV_ENV_MAX_SLOT" ]; then
    echo "$slot"
  fi
}

dev_env_compose() {
  local checkout="$1" slot="$2"
  shift 2
  CITYBORN_CHECKOUT="$checkout" CITYBORN_HOST="$(dev_env_host_id)" CITYBORN_SLOT="$slot" \
    POSTGRES_PORT="$(dev_env_port "$DEV_ENV_POSTGRES_PORT" "$slot")" \
    REDIS_PORT="$(dev_env_port "$DEV_ENV_REDIS_PORT" "$slot")" \
    docker compose -p "$(dev_env_project "$slot")" -f "$checkout/apps/backend/docker-compose.resources.yml" "$@"
}

dev_env_tools() {
  docker compose -f "$1/apps/backend/docker-compose.tools.yml" "${@:2}"
}

dev_env_checkout_slot() {
  local checkout="$1" slot
  slot="$(dev_env_read_slot "$checkout")"
  if [ -z "$slot" ]; then
    echo "Worktree non préparé : lancer scripts/setup-worktree.sh pour lui attribuer son env de dev." >&2
    return 1
  fi
  echo "$slot"
}

dev_env_start() {
  local checkout="$1" slot project owner
  slot="$(dev_env_checkout_slot "$checkout")"
  project="$(dev_env_project "$slot")"
  owner="$(docker ps --all --filter "label=com.docker.compose.project=$project" --format '{{.Label "cityborn.checkout"}}' | head -n 1)"
  if [ -n "$owner" ] && [ "$owner" != "$checkout" ]; then
    echo "L'env $project appartient à $owner : relancer scripts/setup-worktree.sh pour changer de slot." >&2
    return 1
  fi
  echo "Env de dev  : $project (PostgreSQL $(dev_env_port "$DEV_ENV_POSTGRES_PORT" "$slot"), Redis $(dev_env_port "$DEV_ENV_REDIS_PORT" "$slot"))"
  dev_env_compose "$checkout" "$slot" --progress quiet up -d --wait --quiet-pull --remove-orphans
  if [ "$slot" -eq 0 ] && [ -z "${CI:-}" ]; then
    echo "Outils      : Adminer http://localhost:8080, RedisInsight http://localhost:5540"
    dev_env_tools "$checkout" --progress quiet up -d --wait --quiet-pull --remove-orphans
  fi
}

dev_env_stop() {
  local checkout="$1" slot
  slot="$(dev_env_checkout_slot "$checkout")"
  dev_env_compose "$checkout" "$slot" stop
  if [ "$slot" -eq 0 ]; then
    dev_env_tools "$checkout" stop
  fi
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  checkout="$(git rev-parse --show-toplevel)"
  case "${1:-}" in
    start) dev_env_start "$checkout" ;;
    stop) dev_env_stop "$checkout" ;;
    *) echo "Usage : scripts/dev-env.sh start|stop" >&2; exit 1 ;;
  esac
fi
