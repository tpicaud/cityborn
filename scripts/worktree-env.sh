#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/worktree-env.sh <commande> [arguments]

Chaque checkout (principal ou worktree) a son propre PostgreSQL et son propre
Redis, dans un projet Docker Compose à son nom, sur des ports choisis par Docker.

  up                 démarre l'env du checkout courant et affiche ses URL
  run-test CMD…      démarre l'env puis exécute CMD avec TEST_DATABASE_URL et TEST_REDIS_URL
  run-dev CMD…       dans un worktree secondaire, démarre l'env puis exécute CMD avec
                     DATABASE_URL et DIRECT_URL sur sa base cityborn_dev ;
                     dans le checkout principal, exécute CMD sans rien changer
  down               arrête l'env du checkout courant
  destroy [CHEMIN]   supprime l'env d'un checkout et ses volumes (courant par défaut)
  prune              supprime les envs de cette machine dont le checkout n'existe plus

Chaque démarrage d'env lance d'abord prune : l'env d'un worktree supprimé
disparaît au prochain démarrage d'un autre env de la même machine.
USAGE
}

repository_root="$(cd "$(dirname "$0")/.." && pwd -P)"
compose_file="$repository_root/apps/backend/docker-compose.resources.yml"
services=(postgis-worktree redis-worktree)
host_id="$(cat /etc/machine-id 2>/dev/null || hostname)"

checkout_root() {
  local root
  root="$(git -C "${1:-$PWD}" rev-parse --show-toplevel)"
  cd "$root" && pwd -P
}

project_name() {
  local checkout="$1" base checksum
  base="$(basename "$checkout" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_-' '-')"
  checksum="$(printf '%s' "$checkout" | cksum | cut -d ' ' -f 1)"
  echo "cityborn-env-${base%-}-$checksum"
}

env_compose() {
  local checkout="$1"
  shift
  CITYBORN_CHECKOUT="$checkout" CITYBORN_HOST="$host_id" docker compose -p "$(project_name "$checkout")" -f "$compose_file" --profile worktree "$@"
}

is_secondary_worktree() {
  local git_dir common_dir
  git_dir="$(cd "$(git -C "$1" rev-parse --absolute-git-dir)" && pwd -P)"
  common_dir="$(cd "$(git -C "$1" rev-parse --path-format=absolute --git-common-dir)" && pwd -P)"
  [ "$git_dir" != "$common_dir" ]
}

prune_orphan_envs() {
  docker ps --all --filter "label=cityborn.host=$host_id" \
    --format '{{.Label "com.docker.compose.project"}}	{{.Label "cityborn.checkout"}}' |
    sort -u |
    while IFS=$'\t' read -r project checkout; do
      if [ -n "$checkout" ] && [ ! -d "$checkout" ]; then
        echo "Suppression de $project ($checkout introuvable)"
        CITYBORN_CHECKOUT="$checkout" CITYBORN_HOST="$host_id" docker compose -p "$project" -f "$compose_file" --profile worktree --progress quiet down --volumes --remove-orphans ||
          echo "Suppression de $project impossible : relancer pnpm env:prune." >&2
      fi
    done
}

start_env() {
  local checkout="$1"
  prune_orphan_envs >&2 || echo "Nettoyage des envs orphelins impossible : relancer pnpm env:prune." >&2
  if ! env_compose "$checkout" --progress quiet up -d --wait --quiet-pull "${services[@]}" >&2; then
    sleep 1
    env_compose "$checkout" --progress quiet up -d --wait --quiet-pull "${services[@]}" >&2
  fi
  postgres_port="$(published_port "$checkout" postgis-worktree 5432)"
  redis_port="$(published_port "$checkout" redis-worktree 6379)"
}

published_port() {
  local endpoint port
  endpoint="$(env_compose "$1" port "$2" "$3")"
  port="${endpoint##*:}"
  if ! [[ "$port" =~ ^[0-9]+$ ]]; then
    echo "Port publié de $2 introuvable : vérifier que Docker tourne, puis relancer." >&2
    exit 1
  fi
  echo "$port"
}

postgres_url() {
  echo "postgresql://cityborn_test:cityborn_test@127.0.0.1:$postgres_port/$1"
}

redis_url() {
  echo "redis://127.0.0.1:$redis_port/0"
}

command="${1:-}"
[ "$#" -gt 0 ] && shift

case "$command" in
  up)
    checkout="$(checkout_root)"
    start_env "$checkout"
    echo "Projet : $(project_name "$checkout")"
    echo "TEST_DATABASE_URL=$(postgres_url cityborn_test)"
    echo "TEST_REDIS_URL=$(redis_url)"
    echo "DATABASE_URL (worktree secondaire)=$(postgres_url cityborn_dev)"
    ;;
  run-test)
    [ "$#" -gt 0 ] || { usage >&2; exit 1; }
    checkout="$(checkout_root)"
    start_env "$checkout"
    TEST_DATABASE_URL="$(postgres_url cityborn_test)"
    TEST_REDIS_URL="$(redis_url)"
    export TEST_DATABASE_URL TEST_REDIS_URL
    exec "$@"
    ;;
  run-dev)
    [ "$#" -gt 0 ] || { usage >&2; exit 1; }
    checkout="$(checkout_root)"
    if is_secondary_worktree "$checkout"; then
      start_env "$checkout"
      DATABASE_URL="$(postgres_url cityborn_dev)"
      DIRECT_URL="$DATABASE_URL"
      export DATABASE_URL DIRECT_URL
    fi
    exec "$@"
    ;;
  down)
    env_compose "$(checkout_root)" stop "${services[@]}"
    ;;
  destroy)
    if [ -d "${1:-$PWD}" ]; then
      checkout="$(checkout_root "${1:-$PWD}")"
    else
      checkout="$1"
    fi
    env_compose "$checkout" down --volumes --remove-orphans
    ;;
  prune)
    prune_orphan_envs
    ;;
  -h|--help)
    usage
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
