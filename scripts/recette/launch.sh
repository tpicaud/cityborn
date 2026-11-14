#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$repository_root"

slot_count=10

slot_ports() {
  local slot="$1"
  echo $((3100 + 10 * slot)) $((3101 + 10 * slot)) $((4100 + 10 * slot)) $((5434 + 10 * slot)) $((6381 + 10 * slot))
}

recette_compose() {
  docker compose -p "cityborn_recette_$1" -f apps/backend/docker-compose.resources.yml --profile recette "${@:2}"
}

port_is_busy() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

slot_is_free() {
  local port
  for port in $(slot_ports "$1"); do
    if port_is_busy "$port"; then
      return 1
    fi
  done
  [ -z "$(recette_compose "$1" ps -q 2>/dev/null)" ]
}

first_free_slot() {
  local slot
  for ((slot = 0; slot < slot_count; slot++)); do
    if slot_is_free "$slot"; then
      echo "$slot"
      return
    fi
  done
  echo "Aucun slot de recette libre parmi les $slot_count disponibles." >&2
  exit 1
}

slot_lock="${TMPDIR:-/tmp}/cityborn-recette-slot.lock"

lock_slot_choice() {
  local attempt
  for ((attempt = 0; attempt < 300; attempt++)); do
    if mkdir "$slot_lock" 2>/dev/null; then
      trap unlock_slot_choice EXIT
      return
    fi
    sleep 1
  done
  echo "Verrou $slot_lock toujours pris : le supprimer si aucun recette:prepare ne tourne." >&2
  exit 1
}

unlock_slot_choice() {
  rmdir "$slot_lock" 2>/dev/null || true
  trap - EXIT
}

command="${1:-}"

if [ "$command" = prepare ]; then
  lock_slot_choice
  slot="${RECETTE_SLOT:-$(first_free_slot)}"
else
  slot="${RECETTE_SLOT:?RECETTE_SLOT requis : utiliser le slot affiché par pnpm recette:prepare}"
fi

if ! [[ "$slot" =~ ^[0-9]$ ]]; then
  echo "RECETTE_SLOT doit être compris entre 0 et $((slot_count - 1))." >&2
  exit 1
fi

read -r frontend_port back_office_port backend_port postgres_port redis_port <<<"$(slot_ports "$slot")"

export RECETTE_POSTGRES_PORT="$postgres_port"
export RECETTE_REDIS_PORT="$redis_port"
export NODE_ENV=development
export DATABASE_URL="postgresql://cityborn_recette:cityborn_recette@127.0.0.1:$postgres_port/cityborn_recette"
export DIRECT_URL="$DATABASE_URL"
export REDIS_URL="redis://127.0.0.1:$redis_port/0"
export CORS_ORIGIN="http://localhost:$frontend_port"
export BACK_OFFICE_ORIGIN="http://localhost:$back_office_port"
export FRONTEND_URL="http://localhost:$frontend_port"
export NEXT_PUBLIC_REST_BACKEND_URL="http://localhost:$backend_port"
export NEXT_PUBLIC_WEBSOCKET_BACKEND_URL="ws://localhost:$backend_port"

case "$command" in
  prepare)
    echo "RECETTE_SLOT=$slot"
    recette_compose "$slot" up -d --wait postgis-recette redis-recette
    unlock_slot_choice
    pnpm backend exec prisma migrate deploy
    pnpm backend exec prisma db seed
    echo "Frontend : http://localhost:$frontend_port"
    echo "Back-office : http://localhost:$back_office_port"
    echo "Backend : http://localhost:$backend_port"
    ;;
  backend)
    export PORT="$backend_port"
    exec pnpm backend dev
    ;;
  frontend)
    export PORT="$frontend_port"
    exec pnpm frontend dev --port "$frontend_port"
    ;;
  back-office)
    export PORT="$back_office_port"
    exec pnpm back-office dev --port "$back_office_port"
    ;;
  stop)
    recette_compose "$slot" stop postgis-recette redis-recette
    ;;
  *)
    echo "Usage: scripts/recette/launch.sh prepare|backend|frontend|back-office|stop" >&2
    exit 1
    ;;
esac
