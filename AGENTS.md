# Cityborn — guide pour agents

Monorepo pnpm/turbo, TypeScript partout.

- `apps/backend` — NestJS + Prisma
- `apps/frontend`, `apps/back-office` — Next.js
- `apps/mobile` — Expo / React Native
- `packages/api` — contrats ts-rest + schémas zod, source de vérité des types partagés
- `packages/client`, `packages/contexts`, `packages/design-system`, `packages/types`, `packages/utils`

## Style de code

- **Typage first** : le typage est primordial. Le projet doit être type-safe. Un typage clair améliore grandement la DX. Ne jamais utiliser `any` ni affaiblir un type pour faire passer le compilateur.
- **Aucun commentaire** : le naming doit être suffisamment clair pour s'en passer.
- **Éviter `as`** au maximum : un cast casse l'inférence de type et masque des erreurs potentielles. Préférer un typage correct en amont (narrowing, generics, schémas zod) plutôt qu'un cast.
- **Import type-only** obligatoire pour les imports de types (`import type { ... }`) — déjà forcé par Biome (`useImportType`), ne pas le contourner.

## Commandes utiles

- `pnpm typecheck` — typecheck de tout le monorepo (vérifié en CI, doit toujours passer)
- `pnpm format` / `pnpm format:check` — Biome (lint + format)
- `pnpm check:api-compat` — vérifie la rétrocompatibilité des contrats API (vérifié en CI)
- `pnpm dev:web` — lance back-office + frontend + backend + packages
- `pnpm dev:mobile` — lance mobile + backend + packages
- `pnpm --dir apps/backend test` — tests backend (Jest)
- `pnpm --dir packages/api test` — tests de compatibilité OpenAPI
- `pnpm db:start` / `pnpm db:migrate` / `pnpm db:reset` — gestion de la DB locale (Docker + Prisma)

## Frontières du monorepo

- Ne pas dupliquer dans une app un type/schéma qui existe déjà dans `@cityborn/api` ou `@cityborn/types` — les réutiliser.
- `packages/api` est la source de vérité des contrats. Toute évolution d'un contrat existant doit rester rétrocompatible (vérifié par `check:api-compat` en CI avec oasdiff) — un breaking change nécessite un bump de version d'API, pas une modification silencieuse.

## Garde-fous

- Ne jamais modifier une migration Prisma déjà appliquée/mergée : toujours créer une nouvelle migration (`pnpm db:migrate`).
- Ne pas contourner Biome ou le typecheck pour faire passer un build (pas de `// biome-ignore` ou `@ts-ignore` de confort).
- Ne pas toucher aux `overrides` de `pnpm-workspace.yaml` sans comprendre pourquoi elles ont été ajoutées (la plupart corrigent des CVE).
