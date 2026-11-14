#!/usr/bin/env bash
set -euo pipefail

export TURBO_SCM_BASE=origin/main

pnpm lint
pnpm check:agent-docs
pnpm check:axiom-dashboards
pnpm check:api-compat
if [ -z "${TEST_DATABASE_URL:-}${TEST_REDIS_URL:-}" ]; then
  pnpm exec turbo run db:test:start --affected --filter=cityborn-backend
fi
pnpm exec turbo run typecheck test:all --affected
pnpm exec turbo run build --affected --filter=cityborn-frontend --filter=cityborn-back-office
