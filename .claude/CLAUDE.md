# Cityborn — guide pour agents

Monorepo pnpm/turbo, TypeScript partout. Deux règles au-dessus de tout : **type-safe** (jamais `any`, jamais affaiblir un type pour le compilateur) et **bonnes pratiques d'architecture**.

## Vue d'ensemble

| Package / app | Rôle |
|---|---|
| `apps/backend` | NestJS + Prisma. API exposée via contrats ts-rest. |
| `apps/frontend`, `apps/back-office` | Next.js (App Router). |
| `apps/mobile` | Expo / React Native. |
| `packages/api` | **Source de vérité des contrats** : ts-rest + schémas zod, types qui transitent par l'API, `ErrorCode` + messages FR, map zod FR. |
| `packages/client` | Code partagé **front + mobile** qui **ne transite pas** par l'API : schémas de formulaire, contexts, state, utils, types. |
| `packages/core` | Code partagé **backend + client** (front/mobile). Aujourd'hui la logique de jeu (`src/game`) ; a vocation à s'étoffer. Dépend de `@cityborn/api`. |
| `packages/design-system` | Composants UI partagés. |

**Où mettre du code / un type partagé** :

- transite par l'API → `@cityborn/api`
- partagé backend + front/mobile → `@cityborn/core`
- partagé front + mobile uniquement → `@cityborn/client`
- sinon local à l'app

Ne jamais dupliquer un type qui existe déjà dans un package.

## Structure d'une app cliente (front & mobile)

Front et mobile suivent la **même** organisation par domaine — garder les deux cohérents.

| Dossier | Contenu |
|---|---|
| `features/<domaine>/` | Un dossier par domaine fonctionnel : composant d'entrée + `components/` + `hooks/` locaux. C'est ici que va le gros du code. |
| `components/ui/` | Composants UI génériques réutilisables, propres à l'app (hors `@cityborn/design-system`). |
| `lib/` | Intégrations transverses bas niveau : socket, storage du token, visitorId, client API. |
| `contexts/`, `hooks/` | React transverse à plusieurs domaines. |

**Accès à l'API** : mobile → `lib/api/` ; Next → `src/server/` :

- `server/use-server/` — server actions (`'use server'`), wrappées par `toApiResult`.
- `server/server-only/` — loaders de Server Components (`server-only`), wrappés par `unwrapApiResponse`.

**Spécifique Next** : `src/app/` = routing App Router (`layout.tsx`, `page.tsx`, `error.tsx`, `providers.tsx`, `api/`).

## Principes

- Le typage prime : un typage clair est une part majeure de la DX. Corriger en amont (narrowing, generics, zod) plutôt qu'un cast.
- Si l'architecture touchée par une tâche est mauvaise : le **signaler en fin de réponse** avec une piste, sans implémenter le refacto ni dévier de la tâche demandée.

## Style de code

- **Aucun commentaire** pour décrire ce que fait le code — le naming et les types suffisent. Seule exception, en dernier recours : une ligne expliquant un *pourquoi* contre-intuitif (workaround, contrainte externe).
- **Naming précis** : le nom reflète exactement la chose.
  ```typescript
  const service = new RateLimitService(redisService);          // ❌ trop générique
  const rateLimitService = new RateLimitService(redisService); // ✅
  ```
- **Éviter `as`** : un cast casse l'inférence et masque des erreurs.
- **Éviter `else`** : early return ; ternaire seulement si vraiment nécessaire.
- **`import type { … }`** obligatoire pour les types (forcé par Biome `useImportType`).
- **Nouveaux fichiers** : préférer étendre un fichier existant (quitte à le renommer). Créer un fichier seulement si c'est évident vu la structure du dossier ; sinon demander où placer le code.

## Gestion des erreurs — front & mobile

| Contexte | Helper | Résultat |
|---|---|---|
| Wrapper d'API (`use-server/`, `apps/mobile/lib/api/`) | `toApiResult(result)` | `ApiResult<T>` = `{ ok: true, data } \| { ok: false, error: ApiError }` — brancher sur `result.ok` |
| Loader de Server Component (`server-only/`) | `unwrapApiResponse(result)` | body typé, ou `throw` un `ApiResponseError` capté par `error.tsx` |
| Afficher une erreur | `useError()` → `invokeError(error)` | dialog ; accepte `unknown`, normalise via `resolveErrorMessage` (ne pas pré-convertir) ; repli : `invokeError(error, 'message par défaut')` |

- **Ne jamais `throw` un objet nu** : `throw new ApiResponseError(apiError)` (vraie `Error` : stack, `instanceof`).
- **Messages FR** : seule source = `ErrorCode` dans `@cityborn/api` (`resolveErrorMessage` / `getFriendlyErrorMessage`).
- **Map zod FR** : `installFrenchZodErrorMap()` (de `@cityborn/api`) installe les messages de validation zod en français. Appelé une fois au bootstrap de chaque app — `apps/backend/src/main.ts`, `apps/frontend/src/app/providers.tsx`, `apps/back-office/app/providers.tsx`, `apps/mobile/app/_layout.tsx`. Pas d'effet de bord à l'import : l'appel doit rester explicite.
- **Validation de formulaire** : `zodResolver` + schéma partagé (`@cityborn/api` ou `@cityborn/client`). On ne route pas les `fieldErrors` d'un 400 vers les champs (le client valide avec le même schéma) → `!result.ok` → `invokeError(result.error)`.

## Gestion des erreurs — backend (NestJS)

- Lever une exception Nest **typée** depuis les services : `throw new NotFoundException({ code: ErrorCode.X, message })` (idem `ConflictException`, `BadRequestException`, `UnauthorizedException`). `code` = un `ErrorCode` de `@cityborn/api`, jamais une string libre.
- **Ne jamais construire la réponse HTTP soi-même** : les filtres globaux de `main.ts` sérialisent tout au format `ApiError` `{ statusCode, code, message }` — `DefaultExceptionFilter`, `PrismaExceptionFilter`, `RequestValidationErrorFilter`.
- Erreurs Prisma (`P2002`, `P2025`, …) déjà mappées par `PrismaExceptionFilter` — ne pas les `catch` pour les relancer.
- `installFrenchZodErrorMap()` est déjà appelé au bootstrap.

### Structure d'un module backend

- `feature/feature.module.ts` + `controllers/` + `services/` + `mappers/` (entité DB → DTO du contrat).
- Controllers = handlers ts-rest (`@TsRestHandler(contract.x)` + `tsRestHandler`), **fins** : aucune logique métier, tout dans les services.
- Séparer `*.public.*` / `*.admin.*` (controller + service) quand l'auth ou les règles diffèrent.

## Frontières du monorepo

- `packages/api` est la source de vérité des contrats. Toute évolution d'un contrat existant doit rester **rétrocompatible** (`check:api-compat` en CI, oasdiff). Un breaking change = bump de version d'API, jamais une modif silencieuse.
- Bypass ponctuel : une ligne `<METHOD> <path> <texte exact>` dans `packages/api/openapi/compat/err-ignore.txt` (voir *Demander avant d'agir*).

## Commandes

| Commande | Usage |
|---|---|
| `pnpm typecheck` | typecheck du monorepo (CI, doit toujours passer) |
| `pnpm format` / `pnpm format:check` | Biome (lint + format) |
| `pnpm check:api-compat` | rétrocompat des contrats API (CI) |
| `pnpm dev:web` / `pnpm dev:mobile` | stack web / mobile + backend + packages |
| `pnpm --dir apps/backend test` | tests backend (Jest) |
| `pnpm --dir packages/api test` | tests de compatibilité OpenAPI |
| `pnpm db:start` / `db:migrate` / `db:reset` | DB locale (Docker + Prisma) ; lance aussi Redis (`localhost:6379`) + RedisInsight (`localhost:5540`) |

## Demander avant d'agir

- Ajout d'une dépendance npm.
- Breaking change sur un contrat OpenAPI de `packages/api`.
- Ajout d'une ligne dans `packages/api/openapi/compat/err-ignore.txt` (bypass de `check:api-compat`).
- Avant de démarrer chaque grande étape d'un plan.

## Garde-fous

- Ne jamais modifier une migration Prisma déjà appliquée/mergée : toujours en créer une nouvelle (`pnpm db:migrate`).
- Ne pas contourner Biome ni le typecheck (`// biome-ignore`, `@ts-ignore` de confort interdits).
- Ne pas toucher aux `overrides` de `pnpm-workspace.yaml` (la plupart corrigent des CVE).
- Ne jamais commit — laisser le développeur.
- Ne jamais lancer le front ni le mobile pour tester l'UI — demander un test manuel.

## Maintenir ce guide

Tout changement qui modifie une convention ou une décision d'archi décrite ici doit mettre à jour la section concernée **dans le même lot**. Le guide reflète l'état réel du code.
