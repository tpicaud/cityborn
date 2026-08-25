# Cityborn — guide pour agents

Monorepo pnpm/turbo, TypeScript partout.

- `apps/backend` — NestJS + Prisma
- `apps/frontend`, `apps/back-office` — Next.js
- `apps/mobile` — Expo / React Native
- `packages/api` — contrats ts-rest + schémas zod, source de vérité des types partagés
- `packages/client`, `packages/core`, `packages/design-system`

## Ligne directrice du projet

- Les bonnes pratiques de code/architectures sont primordiale. Ne pas hésiter à proposer des refactos si l'architecture actuellement implémenté n'est pas recommandée
- **Typage first** : le typage est primordial. Le projet doit être type-safe. Un typage clair améliore grandement la DX. Ne jamais utiliser `any` ni affaiblir un type pour faire passer le compilateur.

## Style de code

- **Éviter `as`** au maximum : un cast casse l'inférence de type et masque des erreurs potentielles. Préférer un typage correct en amont (narrowing, generics, schémas zod) plutôt qu'un cast.
- **Import type-only** obligatoire pour les imports de types (`import type { ... }`) — déjà forcé par Biome (`useImportType`), ne pas le contourner.
- **Aucun commentaire** : N'ajoute JAMAIS de commentaire dans le code, le naming doit être suffisamment clair pour s'en passer.
- **Pas de bloc else** : préfère des early return au lieux d'un bloc else. Possible de faire un ternaire si c'est vraiement nécessaire
- **Sois précis dans le naming** le nom d'une variable/constante doit refléter précisément ce qu'elle est.
```typescript
const service = new RateLimitService(redisService); // ❌​ à éviter, "service" trop générique
const rateLimitService = new RateLimitService(redisService) // ​✅​ naming précis
```

## Commandes utiles

- `pnpm typecheck` — typecheck de tout le monorepo (vérifié en CI, doit toujours passer)
- `pnpm format` / `pnpm format:check` — Biome (lint + format)
- `pnpm check:api-compat` — vérifie la rétrocompatibilité des contrats API (vérifié en CI)
- `pnpm dev:web` — lance back-office + frontend + backend + packages
- `pnpm dev:mobile` — lance mobile + backend + packages
- `pnpm --dir apps/backend test` — tests backend (Jest)
- `pnpm --dir packages/api test` — tests de compatibilité OpenAPI
- `pnpm db:start` / `pnpm db:migrate` / `pnpm db:reset` — gestion de la DB locale (Docker + Prisma). Lance aussi un Redis local (`localhost:6379`) et RedisInsight (`http://localhost:5540`)

## Frontières du monorepo

- Ne pas dupliquer dans une app un type/schéma qui existe déjà dans `@cityborn/api` (types transitant par l'API) ou `@cityborn/client` (types partagés front/mobile ne transitant pas par l'API) — les réutiliser.
- `packages/api` est la source de vérité des contrats. Toute évolution d'un contrat existant doit rester rétrocompatible (vérifié par `check:api-compat` en CI avec oasdiff) — un breaking change nécessite un bump de version d'API, pas une modification silencieuse.
- Exception : `packages/api/openapi/compat/err-ignore.txt` permet de faire passer un breaking change précis détecté par oasdiff (une ligne `<METHOD> <path> <texte exact du changement>`). Validation manuelle explicite obligatoire 

## Quand demander avant d'agir
- Ajout d'une dépendance npm nouvelle → demander avant
- Modification cassante du contrat openapi de `packages /api`
- Ajout d'une entrée dans `packages/api/openapi/compat/err-ignore.txt` (bypass explicite de `check:api-compat`)
- Avant le début d'implémentation de chaque grande étape d'un plan

## Garde-fous

- Ne jamais modifier une migration Prisma déjà appliquée/mergée : toujours créer une nouvelle migration (`pnpm db:migrate`).
- Ne pas contourner Biome ou le typecheck pour faire passer un build (pas de `// biome-ignore` ou `@ts-ignore` de confort).
- Ne pas toucher aux `overrides` de `pnpm-workspace.yaml` sans comprendre pourquoi elles ont été ajoutées (la plupart corrigent des CVE).
- Ne fais jamais de commit, laisse le developpeur gérer ça
- Ne lance jamais le front ni le mobile pour faire des tests d'interface, demande un test manuel par le développeur
