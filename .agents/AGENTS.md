# Cityborn — guide pour agents

Monorepo pnpm/turbo, TypeScript partout. Deux règles au-dessus de tout : **type-safe** (jamais `any`, jamais affaiblir un type pour le compilateur) et **bonnes pratiques d'architecture**.

Ce fichier ne contient que le **contexte transverse à tout le monorepo**. Les conventions propres à un domaine vivent dans des skills chargés à la demande — voir [Skills](#skills).

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

## Frontières du monorepo

- `packages/api` est la **source de vérité des contrats**. Toute évolution d'un contrat existant doit rester **rétrocompatible** (`check:api-compat` en CI). Un breaking change = bump de version d'API, jamais une modif silencieuse.
- Modifier un contrat `@cityborn/api` (route, schéma zod, type, enum) → skill **`api-contract-change`**.
- Déprécier / nettoyer un élément déprécié → skills **`deprecate`** / **`check-and-remove-deprecated`**.

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

## Commits & PR

- **Commit** : message court, une seule ligne (pas de corps) ; format Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, …) ; pas de signature.
- **PR** : publiée en draft ; titre au format `#<num_issue> - <titre_issue>`.

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

## Skills

Conventions chargées automatiquement quand le contexte le demande (`.agents/skills/`) :

| Skill | Se déclenche quand… |
|---|---|
| `client-app-architecture` | on crée/modifie un composant, hook, feature ou accès API dans `apps/frontend`, `apps/back-office`, `apps/mobile` |
| `client-error-handling` | on affiche/propage une erreur, on écrit un wrapper d'API / loader de Server Component, on branche un formulaire (front & mobile) |
| `backend-conventions` | on crée/modifie un module, controller, service ou mapper dans `apps/backend`, ou on lève une exception Nest |
| `api-contract-change` | on ajoute/modifie un élément de la surface publique de `packages/api` |
| `deprecate` | on déprécie une route / type / champ / valeur d'enum du contrat API |
| `check-and-remove-deprecated` | ménage périodique des dépréciations d'API |
| `issue-github` | on rédige / reformule un ticket GitHub |
| `develop-issue` | on lance ou développe une issue existante dans une tâche et un worktree dédiés |

## Maintenir ce guide

Tout changement qui modifie une convention ou une décision d'archi doit mettre à jour, **dans le même lot**, soit ce fichier (si transverse), soit le `SKILL.md` concerné (si propre à un domaine) — jamais les deux, jamais en double. Le guide reflète l'état réel du code.
