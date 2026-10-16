# Cityborn — guide pour agents

Monorepo pnpm/turbo, TypeScript partout. Ce fichier ne porte que le contexte transverse au monorepo ; les conventions propres à un domaine vivent dans les [skills](#skills).

## Règles prioritaires

### Type-safe

- Aucun `any`.
- Corriger un type en amont (narrowing, generics, schéma zod) plutôt que l'affaiblir pour le compilateur.
- Identifiants métier : types brandés de `@cityborn/api`, validés une fois à l'entrée du domaine puis propagés.

### Architecture

- Chaque package ou app suit l'axe d'organisation que lui attribue la [vue d'ensemble](#vue-densemble).
- Un domaine métier porte le même nom dans chaque package ou app organisé par domaine métier.
- Une feature compose un ou plusieurs domaines et n'existe que dans les packages et apps organisés par feature.
- Le socle technique d'un package ou d'une app ne dépend d'aucun de ses domaines ni de ses features.
- Une architecture défaillante dans le périmètre touché est signalée en fin de réponse avec une piste, sans implémenter le refacto.

## Vue d'ensemble

| Package / app | Rôle | Organisé par |
|---|---|---|
| `apps/backend` | API NestJS + Prisma qui implémente les contrats de `packages/api`. | domaine métier |
| `packages/api` | Source de vérité des contrats : routes ts-rest, events WebSocket, schémas zod, `ErrorCode`. | domaine métier |
| `packages/core` | Logique métier pure partagée par le backend et les clients. | domaine métier |
| `packages/client` | Accès à l'API, état serveur et comportement headless des apps clientes ; agnostique de Next, Expo et du rendu. | feature |
| `apps/frontend`, `apps/back-office` | Next.js (App Router). | feature |
| `apps/mobile` | Expo / React Native. | feature |
| `packages/design-system` | Composants et tokens UI, sans notion métier. | préoccupation technique |

| Axe | Définition | Exemples |
|---|---|---|
| domaine métier | Une notion métier avec ses règles et ses données. | `user`, `category`, `session` |
| feature | Un parcours produit, composé de domaines. | `play`, `profile`, `admin` |
| socle technique | Ce qui ne connaît aucun domaine ni feature. | `api/protocol`, modules `prisma` et `redis` du backend, `client/platform` |

Dépendances autorisées entre packages :

- `core` → `api`
- `backend` → `api`, `core`
- `client` → `api`, `core`
- apps clientes → `api`, `core`, `client`, `design-system`

## Découpage

Ces règles valent en développement comme en revue : chaque **symptôme** cité est un constat à corriger dans le périmètre de la tâche, ou à signaler sinon.

- Concevoir des **modules profonds** : un service, un hook ou un domaine couvre une capacité métier entière derrière une surface publique courte (ex. `AuthService`, `SessionService`, `@cityborn/client/session`). Ses étapes, ses dépendances et sa configuration (secret, URL, options) restent privées : l'appelant fournit une entrée du domaine et reçoit un résultat du domaine. Symptôme : un appelant transmet un secret, un client d'infrastructure ou une option interne au module qu'il appelle.
- **Surface minimale** : un symbole est exporté seulement pour un consommateur réel hors de son fichier. Symptôme : une constante ou une fonction exportée que seul son propre module lit.
- Tracer une nouvelle frontière selon la **raison de changer** : un acteur aux règles distinctes, une dépendance d'infrastructure ou de plateforme à isoler (repository, provider, port), un cycle de vie propre (middleware de handshake, registre de connexions) ou plusieurs consommateurs réels. Une étape d'un même flux reste une méthode ou une fonction de son module.
- **Variantes** : quand une capacité existe en plusieurs variantes (transport, plateforme, acteur), un seul module porte le comportement commun et reçoit la partie variable en paramètre (port, stratégie, fonction injectée), dès la deuxième variante. Symptômes : le même discriminant testé à plusieurs endroits (`if (x.kind === …)`), des classes sœurs qui ne diffèrent que par une méthode d'une ligne, deux factories au corps en grande partie recopié.
- **Cohésion** : ce qui change ensemble vit ensemble ; une notion (ex. les cookies d'auth : noms, chemins, options, lecture, écriture) a une seule maison. Factoriser un fragment dupliqué au troisième usage réel. Symptôme : modifier une notion oblige à toucher plusieurs fichiers qui n'en portent chacun qu'un morceau.
- **Rangement** : les fichiers qui servent une même capacité se regroupent, dès le deuxième, dans un sous-dossier nommé d'après elle (par exemple `auth/identity-providers/` pour les vérifications Apple et Google). À défaut, un fichier va dans le dossier de son unique consommateur, sinon à la racine du module ou du domaine qui possède la notion. Un dossier ou un fichier porte le nom d'une capacité, jamais d'une forme technique (`utils`, `helpers`, `constants`). `common/` (backend) et `shared/` (client) ne reçoivent que ce qu'aucun domaine ne possède seul (par exemple `AuthSession`, construit par `user` et consommé par `auth`). Symptômes : un fichier à la racine alors qu'un seul dossier l'utilise ; deux fichiers qui font le même travail pour des fournisseurs différents rangés séparément ; un fichier de `common/` qui porte la notion d'un seul domaine ; une notion d'un domaine rangée dans un autre ; un nom de forme.
- Entre deux services d'un même domaine, chaque méthode exposée porte une règle ; un simple relais revient à son consommateur. Les couches prévues par les conventions (controller, repository, provider, port, server action) relaient légitimement.

## Style de code

- **Aucun commentaire dans le code, JSDoc compris.** Le naming, les types et le découpage portent l'intention. Seule tolérance : le bloc `@deprecated` / `@deprecatedSince` posé par le skill `deprecate`. Un *pourquoi* que le code ne peut pas porter (workaround, contrainte externe ou réglementaire) va dans le message de commit, la PR ou `docs/` — jamais en commentaire.
- **Naming exact** : chaque nom (variable, fonction, type, fichier, colonne, champ de contrat, clé, room) dit précisément ce que la chose est ou fait, dans le vocabulaire du domaine. Renommer un nom générique, redondant ou qui entre en collision avec un autre domaine (ex. « session » désigne la partie de jeu). Un fichier porte le nom du concept unique qu'il contient (par exemple `apple-id-token.ts`, `bearer-token.ts`).
  ```typescript
  const service = new RateLimitService(redisService);          // ❌ trop générique
  const rateLimitService = new RateLimitService(redisService); // ✅
  ```
- **Code en anglais** : identifiants, noms de tests, logs et messages d'erreur techniques s'écrivent en anglais. Le français est réservé aux textes destinés à l'utilisateur final (UI, messages d'`ErrorCode`, map zod FR).
- **Éviter `as`** : un cast casse l'inférence et masque des erreurs.
- **Objets typés** : quand un type nommé décrit l'objet créé, préférer `const objet: Type = { ... }`. Réserver `satisfies Type` aux cas où conserver le type inféré de l'expression est utile ; éviter `satisfies Parameters<typeof méthode>[0]` si un type nommé existe.
- **Paramètre objet** : une fonction ou une méthode qui reçoit deux valeurs ou plus les prend dans un seul objet typé, déstructuré dans la signature, pour que l'appel nomme chaque argument et que l'autocomplétion propose ses champs (`setIfAbsent({ key, value, ttlSeconds })`). Le type de cet objet s'écrit en ligne dans la signature ; il devient un type nommé seulement s'il est exporté ou partagé par plusieurs signatures. Appliquer la règle à chaque signature créée ou modifiée. Restent positionnelles les signatures imposées par un framework, une bibliothèque ou une interface externe : injection par constructeur Nest, `canActivate(context)`, callbacks de tableau, `fetch(input, init)`.
- **`type` par défaut** : une forme de données, une union, un type dérivé ou des options s'écrivent avec `type`. `interface` est réservée aux contrats que plusieurs implémentations respectent (port, stratégie, repository, client externe simulé en test ; par exemple `TokenStorage`, `AuthTransport`, `UserRepository`) et à l'augmentation de déclarations (`declare global { interface Window { … } }`). Une `interface` qui décrit des données (DTO, options, requête enrichie, résultat de fonction) est convertie dès qu'elle se trouve dans le périmètre touché.
- **Variables locales** : annoter explicitement chaque `const` et `let` dès qu'un type approprié peut être nommé, y compris pour le résultat d'une méthode et les données de test. Ne laisser le type implicite que lorsqu'aucune annotation explicite pertinente n'est possible.
- **Éviter `else`** : early return ; ternaire seulement si vraiment nécessaire.
- **Itérer avec les méthodes de tableau** (`map`, `filter`, `reduce`, `find`, `some`, `every`, `forEach`) et `Promise.all` pour l'asynchrone ; un traitement asynchrone séquentiel passe par une fonction récursive. Les boucles `for`, `for…of` et `for…in` sont proscrites, tests compris.
- **`import type { … }`** obligatoire pour les types (forcé par Biome `useImportType`).
- **Nouveaux fichiers** : inspecter les fichiers voisins et suivre le précédent dominant. Préférer étendre un fichier existant quand sa responsabilité reste cohérente. Demander uniquement si plusieurs emplacements correspondent à des responsabilités différentes et que le choix affecte l'architecture publique.

## Frontières du monorepo

- `packages/api` est la **source de vérité des contrats**. Toute évolution d'un contrat existant doit rester **rétrocompatible** (`check:api-compat` en CI). Un breaking change = bump de version d'API, jamais une modif silencieuse. Le code qui appelle une route en dérive chemin et méthode depuis `contract` (`contract.auth.refresh.path`) plutôt que de les écrire en littéral.
- Modifier un contrat `@cityborn/api` (route, event WS, schéma zod, type, enum) → skill **`api-contract-change`**.
- Déprécier / nettoyer un élément déprécié → skills **`deprecate`** / **`check-and-remove-deprecated`**.

## Configuration d'environnement

- Chaque application possède ses schémas Zod et expose une configuration typée en camelCase. Le code applicatif consomme cette configuration ; réserver les accès directs à `process.env` aux modules de configuration et aux points d'entrée techniques des frameworks.
- Valider chaque contexte à sa phase d'utilisation : démarrage NestJS, commande Prisma, développement et build pour les variables publiques Next.js, démarrage du serveur pour ses variables privées, prébuild pour la configuration native Expo, puis Metro ou EAS pour sa configuration client. Le typecheck reste indépendant de la configuration applicative.
- Conserver des accès littéraux aux variables publiques Next.js et Expo afin que leurs bundlers puissent les injecter.
- Tout ajout, suppression ou renommage met à jour dans le même lot le schéma, ses consommateurs, le `.env.example` de l'application et la configuration Turbo concernée.

## Commandes

| Commande | Usage |
|---|---|
| `pnpm typecheck` | typecheck du monorepo (CI, doit toujours passer) |
| `pnpm format` / `pnpm format:check` | Biome (lint + format) |
| `pnpm check:agent-docs` | structure, liens, routage et couverture des instructions agents |
| `pnpm check:api-compat` | rétrocompat des contrats API (CI) |
| `pnpm dev:web` / `pnpm dev:mobile` | frontend / mobile + back-office + backend |
| `pnpm --dir apps/backend test` | tests backend unitaires (Jest) |
| `pnpm db:test:start` / `pnpm db:test:stop` | démarrer (et attendre les healthchecks) / arrêter uniquement Postgres + Redis du profil `test` |
| `pnpm test:int` / `pnpm test:e2e` | tests backend d'intégration / e2e sur la stack dédiée ; après `pnpm install` puis `pnpm db:test:start` |
| `pnpm --dir apps/backend test:all` / `pnpm --dir apps/backend test:cov` | tous les projets Jest / avec couverture |
| `pnpm --dir packages/api test` | tests de compatibilité OpenAPI |
| `pnpm db:start` / `db:migrate` / `db:reset` | DB locale (Docker + Prisma) ; lance aussi Redis (`localhost:6379`) + RedisInsight (`localhost:5540`) |
| `./scripts/setup-worktree.sh [chemin] [--skip-install]` | prépare un worktree : copie les `.env` du checkout principal puis `pnpm install` (commande `/setup-worktree`) |
| `./scripts/cleanup-worktree.sh [chemin]` | supprime un worktree dont tout le travail est publié et remet le checkout principal sur un `main` à jour ; lançable depuis le worktree à supprimer, sans argument (skill manuel `cleanup-worktree`) |

### Stratégie de vérification

- Pendant l'implémentation, lancer d'abord les tests et vérifications ciblés sur les packages modifiés.
- Exécuter les contrôles transverses explicitement requis par un skill une seule fois avant le compte rendu final.
- Ne pas répéter un contrôle déjà réussi sans nouveau changement pertinent ou échec qui le justifie.
- Pour une modification réversible et de faible impact, ne pas ajouter un test qui ne ferait que reproduire l'implémentation. Tester les comportements et invariants significatifs.

## Commits & PR

- **Commit** : message court, en anglais, une seule ligne (pas de corps) ; format Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, …) ; pas de signature.
- **PR** : publiée en draft ; titre au format `#<num_issue> - <titre_issue>`.

## Demander avant d'agir

- Ajout d'une dépendance npm.
- Breaking change sur un contrat OpenAPI de `packages/api`.
- Ajout d'une ligne dans `packages/api/tools/compat/err-ignore.txt` (bypass de `check:api-compat`).

## Garde-fous

- Ne jamais modifier une migration Prisma déjà appliquée/mergée : toujours en créer une nouvelle (`pnpm db:migrate`).
- Ne pas contourner Biome ni le typecheck (`// biome-ignore`, `@ts-ignore` de confort interdits).
- Ne pas toucher aux `overrides` de `pnpm-workspace.yaml` (la plupart corrigent des CVE).
- Ne jamais lancer le front ni le mobile pour tester l'UI — demander un test manuel.

## Skills

Les conventions propres à un domaine sont découvertes automatiquement depuis les descriptions de `.agents/skills/*/SKILL.md`.

## Maintenir ce guide

Tout changement qui modifie une convention ou une décision d'archi doit mettre à jour, **dans le même lot**, soit ce fichier (si transverse), soit le `SKILL.md` concerné (si propre à un domaine) — jamais les deux, jamais en double. Le guide reflète l'état réel du code.

Avant toute modification d'`AGENTS.md` ou d'un fichier de `.agents/skills/` (références comprises), y compris une retouche en cours d'issue ou de review, charger le skill `writing-for-agents`. Après la modification, lancer `pnpm check:agent-docs`, puis vérifier dans `.agents/evals/skill-cases.md` les cas du skill touché, ses non-déclenchements et ses chevauchements.

Tout changement qui affecte le démarrage local, ses prérequis, les variables d'environnement, les ports, les commandes `dev:web` / `dev:mobile` ou l'arborescence présentée dans le `README.md` racine doit mettre à jour ce README dans le même lot. Vérifier en fin de tâche qu'il reste cohérent avec les scripts, les `.env.example` et la structure du monorepo.
