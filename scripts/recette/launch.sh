#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$repository_root"

export NODE_ENV=development
export DATABASE_URL=postgresql://cityborn_recette:cityborn_recette@127.0.0.1:5434/cityborn_recette
export DIRECT_URL="$DATABASE_URL"
export REDIS_URL=redis://127.0.0.1:6381/0
export CORS_ORIGIN=http://localhost:3100
export BACK_OFFICE_ORIGIN=http://localhost:3101
export FRONTEND_URL=http://localhost:3100
export NEXT_PUBLIC_REST_BACKEND_URL=http://localhost:4100
export NEXT_PUBLIC_WEBSOCKET_BACKEND_URL=ws://localhost:4100

case "${1:-}" in
  prepare)
    pnpm db:recette:start
    pnpm backend exec prisma migrate deploy
    pnpm backend exec prisma db seed
    ;;
  backend)
    export PORT=4100
    exec pnpm backend dev
    ;;
  frontend)
    export PORT=3100
    exec pnpm frontend dev --port 3100
    ;;
  back-office)
    export PORT=3101
    exec pnpm back-office dev --port 3101
    ;;
  *)
    echo "Usage: scripts/recette/launch.sh prepare|backend|frontend|back-office" >&2
    exit 1
    ;;
esac
