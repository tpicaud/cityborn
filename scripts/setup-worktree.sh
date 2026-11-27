#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/setup-worktree.sh [chemin_du_worktree] [--skip-install]

Sans argument, prépare le worktree courant.
  - conserve les .env présents et copie seulement les manquants depuis le principal
  - vérifie les .env requis des apps
  - au premier setup, attribue au worktree le premier slot libre de 1 à 9
  - lance son env de dev, le projet Docker Compose cityborn-<dossier du worktree>
  - écrit le nom du projet et les ports du slot dans les .env des apps
  - exécute `pnpm install` dans le worktree (sauf --skip-install)
  - migre et seede sa base cityborn_dev
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
main_root="$(git -C "$target_root" worktree list --porcelain | awk '/^worktree / && !found {print substr($0, 10); found=1}')"

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

env_value() {
  { grep -m 1 "^$2=" "$1" 2>/dev/null || true; } | cut -d= -f2- | tr -d '\r'
}

set_env() {
  local file="$1" key="$2" value="$3"
  if grep -q "^$key=" "$file"; then
    KEY="$key" VALUE="$value" awk 'index($0, ENVIRON["KEY"] "=") == 1 { print ENVIRON["KEY"] "=" ENVIRON["VALUE"]; next } { print }' \
      "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
  else
    [ -z "$(tail -c 1 "$file")" ] || echo >> "$file"
    echo "$key=$value" >> "$file"
  fi
}

compose_file="$target_root/apps/backend/docker-compose.resources.yml"
backend_env="$target_root/apps/backend/.env"
folder="$(basename "$target_root" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_-' '-')"
project="cityborn-${folder%-}"
if [ "$project" = "cityborn-main" ]; then
  echo "Le dossier du worktree ne peut pas s'appeler main : cityborn-main est l'env du checkout principal." >&2
  exit 1
fi

project_compose_file="$(docker ps --all --filter "label=com.docker.compose.project=$project" \
  --format '{{.Label "com.docker.compose.project.config_files"}}' | sort -u | head -n 1)"
if [ -n "$project_compose_file" ] && [ "${project_compose_file%%,*}" != "$compose_file" ]; then
  echo "L'env $project appartient déjà à ${project_compose_file%%/apps/backend/*} : s'il a disparu, lancer scripts/teardown-worktree.sh --orphans ; sinon renommer le dossier de l'un des deux worktrees." >&2
  exit 1
fi

postgres_port="$(env_value "$backend_env" POSTGRES_PORT)"
if [ "$(env_value "$backend_env" COMPOSE_PROJECT_NAME)" = "$project" ] && [ -n "$postgres_port" ]; then
  slot=$(((postgres_port - 5432) / 10))
else
  used_postgres_ports="$(
    git -C "$target_root" worktree list --porcelain | awk '/^worktree / {print substr($0, 10)}' |
      while IFS= read -r checkout; do
        [ "$checkout" != "$target_root" ] || continue
        port="$(env_value "$checkout/apps/backend/.env" POSTGRES_PORT)"
        echo "${port:-5432}"
      done
  )"
  slot=""
  for candidate in 1 2 3 4 5 6 7 8 9; do
    if ! grep -qx "$((5432 + 10 * candidate))" <<< "$used_postgres_ports"; then
      slot="$candidate"
      break
    fi
  done
  if [ -z "$slot" ]; then
    echo "Aucun slot libre parmi 1 à 9 : supprimer un worktree inutilisé." >&2
    exit 1
  fi
fi

slot_port() {
  echo $(($1 + 10 * slot))
}

postgres_port="$(slot_port 5432)"
redis_port="$(slot_port 6379)"
redis_test_port="$(slot_port 6380)"
backend_port="$(slot_port 4000)"
frontend_port="$(slot_port 3000)"
back_office_port="$(slot_port 3001)"
metro_port="$(slot_port 8081)"

echo "Env de dev  : $project (slot $slot : PostgreSQL $postgres_port, Redis $redis_port, Redis de test $redis_test_port)"
COMPOSE_PROJECT_NAME="$project" COMPOSE_PROFILES="" POSTGRES_PORT="$postgres_port" REDIS_PORT="$redis_port" \
  REDIS_TEST_PORT="$redis_test_port" \
  docker compose -f "$compose_file" --progress quiet up -d --wait --quiet-pull --remove-orphans

for app_env in "$target_root"/apps/*/.env "$target_root"/apps/*/.env.local "$target_root"/apps/*/.env.development "$target_root"/apps/*/.env.development.local; do
  [ -f "$app_env" ] || continue
  BACKEND="$backend_port" FRONTEND="$frontend_port" BACK_OFFICE="$back_office_port" METRO="$metro_port" \
    perl -pi -e 's/:4000(?!\d)/:$ENV{BACKEND}/g; s/:3000(?!\d)/:$ENV{FRONTEND}/g; s/:3001(?!\d)/:$ENV{BACK_OFFICE}/g; s/:8081(?!\d)/:$ENV{METRO}/g' \
    "$app_env"
done

set_env "$backend_env" COMPOSE_PROJECT_NAME "$project"
set_env "$backend_env" COMPOSE_PROFILES ""
set_env "$backend_env" POSTGRES_PORT "$postgres_port"
set_env "$backend_env" REDIS_PORT "$redis_port"
set_env "$backend_env" REDIS_TEST_PORT "$redis_test_port"
set_env "$backend_env" PORT "$backend_port"
set_env "$backend_env" DATABASE_URL "postgresql://postgres:postgres@localhost:$postgres_port/cityborn_dev"
set_env "$backend_env" DIRECT_URL "postgresql://postgres:postgres@localhost:$postgres_port/cityborn_dev"
set_env "$backend_env" REDIS_URL "redis://localhost:$redis_port/0"
set_env "$backend_env" TEST_DATABASE_URL "postgresql://cityborn_test:cityborn_test@localhost:$postgres_port/cityborn_test"
set_env "$backend_env" TEST_REDIS_URL "redis://localhost:$redis_test_port/0"
set_env "$target_root/apps/frontend/.env" PORT "$frontend_port"
set_env "$target_root/apps/back-office/.env" PORT "$back_office_port"
set_env "$target_root/apps/mobile/.env" RCT_METRO_PORT "$metro_port"

cd "$target_root"
if [ "$skip_install" = true ]; then
  echo "pnpm install ignoré (--skip-install)."
else
  echo "pnpm install…"
  pnpm install
fi

echo "Migrations et seed de cityborn_dev…"
pnpm --dir apps/backend exec prisma migrate deploy
pnpm --dir apps/backend exec prisma db seed
