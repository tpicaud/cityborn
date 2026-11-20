#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/setup-worktree.sh [chemin_du_worktree] [--skip-install]

Sans argument, prépare le worktree courant.
  - conserve les .env présents et copie seulement les manquants depuis le principal
  - vérifie les .env requis des apps
  - supprime les env Docker des worktrees disparus
  - lance le PostgreSQL et le Redis du worktree, et écrit leurs URL dans apps/backend/.env
  - exécute `pnpm install` dans le worktree (sauf --skip-install)
USAGE
}

target=""
skip_install=false

for arg in "$@"; do
  case "$arg" in
    --skip-install) skip_install=true ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Option inconnue : $arg" >&2; usage >&2; exit 1 ;;
    *)
      if [ -n "$target" ]; then
        echo "Un seul chemin de worktree est accepté." >&2
        exit 1
      fi
      target="$arg"
      ;;
  esac
done

target="${target:-$PWD}"

if [ ! -d "$target" ]; then
  echo "Worktree introuvable : $target" >&2
  exit 1
fi

target_root="$(git -C "$target" rev-parse --show-toplevel)"
main_root="$(git -C "$target" worktree list --porcelain | awk '/^worktree / && !found {print substr($0, 10); found=1}')"

if [ ! -d "$main_root" ]; then
  echo "Checkout principal introuvable : $main_root" >&2
  exit 1
fi

if [ "$target_root" = "$main_root" ]; then
  echo "Rien à faire : $target_root est le checkout principal." >&2
  exit 1
fi

echo "Worktree    : $target_root"
echo "Source .env : $main_root"

env_files="$(git -C "$main_root" ls-files --others --ignored --exclude-standard \
  -- ':(glob).env' ':(glob).env.*' ':(glob)**/.env' ':(glob)**/.env.*' 2>/dev/null)"

copied=0
while IFS= read -r env_file; do
  case "$env_file" in
    "") continue ;;
    */) continue ;;
    *node_modules/*) continue ;;
  esac
  if [ -e "$target_root/$env_file" ] || [ -L "$target_root/$env_file" ]; then
    echo "  conservé $env_file"
    continue
  fi
  mkdir -p "$target_root/$(dirname "$env_file")"
  cp -p "$main_root/$env_file" "$target_root/$env_file"
  echo "  copié $env_file"
  copied=$((copied + 1))
done <<< "$env_files"

if [ "$copied" -eq 0 ]; then
  echo "Aucun fichier .env à copier depuis $main_root." >&2
fi

required_examples="$(git -C "$target_root" ls-files -- ':(glob)apps/*/.env.example')"
missing_env=false
while IFS= read -r example; do
  [ -n "$example" ] || continue
  required_env="${example%.example}"
  if [ ! -f "$target_root/$required_env" ]; then
    echo "Fichier requis manquant : $required_env ; le configurer avant de développer." >&2
    missing_env=true
  fi
done <<< "$required_examples"

if [ "$missing_env" = true ]; then
  exit 1
fi

compose_file="$target_root/apps/backend/docker-compose.resources.yml"
backend_env="$target_root/apps/backend/.env"
host_id="$(cat /etc/machine-id 2>/dev/null || hostname)"
worktree_name="$(basename "$target_root" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_-' '-')"
project="cityborn-env-${worktree_name%-}-$(printf '%s' "$target_root" | cksum | cut -d ' ' -f 1)"

docker ps --all --filter "label=cityborn.host=$host_id" \
  --format '{{.Label "com.docker.compose.project"}}	{{.Label "cityborn.checkout"}}' |
  sort -u |
  while IFS=$'\t' read -r orphan_project orphan_checkout; do
    if [ ! -d "$orphan_checkout" ]; then
      echo "  env supprimé $orphan_project ($orphan_checkout introuvable)"
      docker compose -p "$orphan_project" -f "$compose_file" --profile test down --volumes --remove-orphans >/dev/null 2>&1 ||
        echo "  suppression impossible : $orphan_project" >&2
    fi
  done

published_port() {
  docker compose -p "$project" -f "$compose_file" --profile test port "$1" "$2" 2>/dev/null | sed 's/.*://' || true
}

free_port() {
  local port
  while :; do
    port=$((20000 + RANDOM % 20000))
    if [ "$port" != "${1:-}" ] && ! (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
      echo "$port"
      return
    fi
  done
}

postgres_port="$(published_port postgis-test 5432)"
postgres_port="${postgres_port:-$(free_port)}"
redis_port="$(published_port redis-test 6379)"
redis_port="${redis_port:-$(free_port "$postgres_port")}"

echo "Env Docker  : $project (PostgreSQL $postgres_port, Redis $redis_port)"
CITYBORN_CHECKOUT="$target_root" CITYBORN_HOST="$host_id" TEST_POSTGRES_PORT="$postgres_port" TEST_REDIS_PORT="$redis_port" \
  docker compose -p "$project" -f "$compose_file" --profile test --progress quiet \
  up -d --wait --quiet-pull --remove-orphans postgis-test redis-test

set_backend_env() {
  if grep -q "^$1=" "$backend_env"; then
    sed -i.bak "s|^$1=.*|$1=$2|" "$backend_env"
    rm -f "$backend_env.bak"
  else
    [ -z "$(tail -c 1 "$backend_env")" ] || echo >> "$backend_env"
    echo "$1=$2" >> "$backend_env"
  fi
}

postgres_url="postgresql://cityborn_test:cityborn_test@127.0.0.1:$postgres_port"
set_backend_env DATABASE_URL "$postgres_url/cityborn_dev"
set_backend_env DIRECT_URL "$postgres_url/cityborn_dev"
set_backend_env TEST_DATABASE_URL "$postgres_url/cityborn_test"
set_backend_env TEST_REDIS_URL "redis://127.0.0.1:$redis_port/0"

if [ "$skip_install" = true ]; then
  echo "pnpm install ignoré (--skip-install)."
  exit 0
fi

echo "pnpm install…"
cd "$target_root"
pnpm install
