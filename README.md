# Cityborn

Cityborn est un jeu de géographie où l'on devine le lieu de naissance de personnalités. Le projet regroupe ses applications web, mobile et backend dans un monorepo TypeScript.

## Prérequis

- Node.js 24
- pnpm 10.33.2
- Docker
- Pour le mobile : un téléphone iOS ou Android sur le même réseau Wi-Fi que la machine de dev

## Installation

```bash
pnpm install

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/back-office/.env.example apps/back-office/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Renseigner ensuite les variables requises dans les fichiers `.env` (demander les valeurs sensibles à l'équipe).

## Env de dev

Chaque checkout, principal ou worktree, a son env de dev : un projet Docker Compose avec un PostgreSQL (bases `cityborn_dev` et `cityborn_test`) et deux Redis, un pour le dev et un pour les tests, dans des volumes nommés.

- **Nom** : `cityborn-main` pour le principal, `cityborn-<dossier du worktree>` pour un worktree.
- **Slot** : `0` pour le principal ; au premier setup, un worktree reçoit le premier slot libre de `1` à `9` et le garde.
- **Ports** : chaque port vaut son défaut + 10 × slot ; PostgreSQL, Redis et les outils n'écoutent que sur `127.0.0.1`.

| Service | Défaut (slot 0) | Slot 1 |
|---|---|---|
| Backend | 4000 | 4010 |
| Frontend | 3000 | 3010 |
| Back-office | 3001 | 3011 |
| Metro | 8081 | 8091 |
| PostgreSQL | 5432 | 5442 |
| Redis | 6379 | 6389 |
| Redis de test | 6380 | 6390 |

La connexion Google sur le web suppose que le client OAuth de dev autorise les origines `http://localhost:3000` à `3090` et `3001` à `3091`.

Docker Compose lit le nom du projet, ses profils et ses ports dans `apps/backend/.env` (`COMPOSE_PROJECT_NAME`, `COMPOSE_PROFILES`, `POSTGRES_PORT`, `REDIS_PORT`, `REDIS_TEST_PORT`). `pnpm env:start` lance l'env du checkout courant et `pnpm env:stop` l'arrête en gardant ses données. Dans le principal, le profil `tools` ajoute Adminer sur `http://localhost:8080` et RedisInsight sur `http://localhost:5540`.

Dans un worktree, `./scripts/setup-worktree.sh` prépare tout ; il est rejouable et garde le slot :

- copie les `.env` manquants depuis le principal ;
- supprime l'env des worktrees disparus ;
- lance l'env du worktree, puis écrit son nom et ses ports dans les `.env` des apps, en gardant l'hôte des URL ;
- lance `pnpm install`, puis migre et seede `cityborn_dev`.

Dans un worktree non préparé, `pnpm env:start` échoue et renvoie à ce script.

### Passer au nouveau modèle

Dans le checkout principal, une fois sur une branche qui contient ce modèle :

```bash
docker compose -p cityborn-dev down --volumes
docker compose -p cityborn-test down --volumes
sudo rm -rf apps/backend/docker-data apps/backend/redis-data
```

Reporter ensuite dans les `.env` du principal les valeurs des `.env.example` (`COMPOSE_PROJECT_NAME`, `COMPOSE_PROFILES`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `TEST_*`, `RCT_METRO_PORT`), lancer `pnpm env:start && pnpm db:dev:reset`, puis relancer `./scripts/setup-worktree.sh` dans chaque worktree à jour de `main`.

## Lancement

```bash
pnpm env:start      # env de dev du checkout
pnpm db:dev:reset   # base vidée, migrations et seed de développement
pnpm dev:web        # frontend, back-office et backend
```

`pnpm db:dev:up` applique les nouvelles migrations sans vider la base. Dans un worktree préparé, `pnpm env:start` suffit : sa base est déjà migrée et seedée.

`pnpm lint` vérifie le formatage et les règles de code ; `pnpm format` applique les corrections. `pnpm typecheck` vérifie les types. `pnpm check` lance les vérifications de types et Biome. Ces commandes existent aussi dans chaque app et package.

Les apps écoutent sur les ports du slot : `http://localhost:3000` (frontend), `3001` (back-office) et `4000` (backend) dans le principal.

`pnpm dev` lance toutes les applications, mobile compris ; `pnpm dev:<app>` n'en lance qu'une (`backend`, `frontend` ou `back-office`).

`pnpm test` lance les tests sans infrastructure ; `pnpm test:cov` y ajoute la couverture et `pnpm test:watch` les relance en continu. `pnpm test:all` lance toutes les suites sur la base `cityborn_test` et le Redis de test de l'env du checkout, sans toucher aux données de dev. L'intégration et les e2e du backend partagent la même base : lancer deux exécutions l'une après l'autre.

`pnpm verify` lance les contrôles de la CI des PR, hors prebuild mobile, sur ce qui change par rapport à `main` : Biome, docs agents, dashboards Axiom, compatibilité API, typecheck, toutes les suites et builds statiques des clients web touchés. Il demande l'env du checkout lancé.

La seed crée deux comptes :

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| `admin` | `Password123` | `admin` (back-office) |
| `player` | `Password123` | `player` (frontend) |

## Mobile

L'application utilise des modules natifs : elle nécessite un **dev build** (application `Cityborn (Dev)`) installé sur le téléphone, à réinstaller seulement quand le code natif ou les dépendances natives changent.

### 1. Configurer `apps/mobile/.env`

- Remplacer `<local_ip>` par l'IP locale de la machine (`ipconfig` / `ip addr`).
- Renseigner les clés Google Maps et OAuth.

### 2. Installer un dev build

Lancer le workflow GitHub Actions `Build Android App` ou `Build iOS App` (**Actions → workflow → Run workflow**, environnement et profil `development`), puis ouvrir sur le téléphone le lien d'installation affiché dans le résumé du run.

- **Android** : autoriser l'installation depuis des sources inconnues. Alternative locale : `pnpm --dir apps/mobile build:android:development` (SDK Android et JDK 17 requis).
- **iOS** : la première fois, demander à un admin d'enregistrer l'iPhone (`eas device:create`) puis relancer le workflow. Ouvrir le lien dans Safari, puis activer **Réglages → Confidentialité et sécurité → Mode développeur** et redémarrer.

### 3. Lancer l'app

```bash
pnpm env:start
pnpm dev:mobile
```

Ouvrir `Cityborn (Dev)` sur le téléphone puis scanner le QR code affiché par Expo. En cas d'échec de connexion, vérifier que les ports Metro et backend du slot (`8081` et `4000` dans le principal) sont accessibles depuis le téléphone (pare-feu).

## Organisation

```text
cityborn/
├── apps/
│   ├── backend/         # API NestJS, Prisma et WebSocket
│   ├── frontend/        # Application web Next.js exportée en site statique
│   ├── back-office/     # Administration Next.js exportée en site statique
│   └── mobile/          # Application Expo / React Native
├── packages/
│   ├── api/             # Contrats API, schémas et types partagés
│   ├── client/          # Code partagé entre les clients
│   ├── core/            # Logique partagée backend et clients
│   └── design-system/   # Tokens, thème, assets et composants Tamagui partagés
├── docs/                # Documentation technique
├── infra/               # Infrastructure
├── lint-rules/          # Règles Biome du monorepo (plugins GritQL)
└── scripts/             # Scripts du monorepo
```
