#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/setup-worktree.sh [chemin_du_worktree] [--skip-install]

Sans argument, prépare le worktree courant.
  - conserve les .env présents et copie seulement les manquants depuis le principal
  - vérifie les .env requis des apps
  - supprime les env de dev des worktrees disparus et libère leur slot
  - attribue au worktree le premier slot libre à partir de 1, gardé dans .cityborn-slot
  - lance l'env de dev du worktree (scripts/dev-env.sh start)
  - écrit les ports et URL du slot dans les .env des apps
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
. "$target_root/scripts/dev-env.sh"
main_root="$(dev_env_main_root "$target_root")"

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

dev_env_provision "$target_root"
slot="$(dev_env_checkout_slot "$target_root")"

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

shift_env_ports() {
  local file="$1" key="$2" value shifted="" port
  value="$(grep -m 1 "^$key=" "$file" | cut -d= -f2-)" || return 0
  while [[ "$value" =~ :([0-9]+) ]]; do
    port="${BASH_REMATCH[1]}"
    shifted+="${value%%"${BASH_REMATCH[0]}"*}:$(dev_env_rebase_port "$port" "$slot")"
    value="${value#*"${BASH_REMATCH[0]}"}"
  done
  set_env "$file" "$key" "$shifted$value"
}

backend_port="$(dev_env_port "$DEV_ENV_BACKEND_PORT" "$slot")"
frontend_port="$(dev_env_port "$DEV_ENV_FRONTEND_PORT" "$slot")"
back_office_port="$(dev_env_port "$DEV_ENV_BACK_OFFICE_PORT" "$slot")"
postgres_port="$(dev_env_port "$DEV_ENV_POSTGRES_PORT" "$slot")"
redis_port="$(dev_env_port "$DEV_ENV_REDIS_PORT" "$slot")"

backend_env="$target_root/apps/backend/.env"
set_env "$backend_env" PORT "$backend_port"
shift_env_ports "$backend_env" CORS_ORIGIN
set_env "$backend_env" BACK_OFFICE_ORIGIN "http://localhost:$back_office_port"
set_env "$backend_env" FRONTEND_URL "http://localhost:$frontend_port"
set_env "$backend_env" DATABASE_URL "postgresql://postgres:postgres@localhost:$postgres_port/cityborn_dev"
set_env "$backend_env" DIRECT_URL "postgresql://postgres:postgres@localhost:$postgres_port/cityborn_dev"
set_env "$backend_env" REDIS_URL "redis://localhost:$redis_port/0"
set_env "$backend_env" TEST_DATABASE_URL "postgresql://cityborn_test:cityborn_test@localhost:$postgres_port/cityborn_test"
set_env "$backend_env" TEST_REDIS_URL "redis://localhost:$redis_port/1"

frontend_env="$target_root/apps/frontend/.env"
set_env "$frontend_env" PORT "$frontend_port"
set_env "$frontend_env" NEXT_PUBLIC_REST_BACKEND_URL "http://localhost:$backend_port"
set_env "$frontend_env" NEXT_PUBLIC_WEBSOCKET_BACKEND_URL "ws://localhost:$backend_port"

back_office_env="$target_root/apps/back-office/.env"
set_env "$back_office_env" PORT "$back_office_port"
set_env "$back_office_env" NEXT_PUBLIC_REST_BACKEND_URL "http://localhost:$backend_port"

mobile_env="$target_root/apps/mobile/.env"
set_env "$mobile_env" RCT_METRO_PORT "$(dev_env_port "$DEV_ENV_METRO_PORT" "$slot")"
shift_env_ports "$mobile_env" EXPO_PUBLIC_REST_BACKEND_URL
shift_env_ports "$mobile_env" EXPO_PUBLIC_WEBSOCKET_BACKEND_URL

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
