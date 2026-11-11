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

Dans un worktree secondaire, `./scripts/setup-worktree.sh` copie les `.env` du checkout principal puis lance `pnpm install`.

## Lancement

```bash
pnpm db:dev:start   # PostgreSQL et Redis
pnpm db:dev:reset   # base vidée, migrations et seed de développement
pnpm dev:web    # frontend, back-office et backend
```

`pnpm db:dev:up` applique les nouvelles migrations sans vider la base.

`pnpm lint` vérifie le formatage et les règles de code ; `pnpm format` applique les corrections. `pnpm typecheck` vérifie les types. `pnpm check` lance les vérifications de types et Biome. Ces commandes existent aussi dans chaque app et package.

- Frontend : `http://localhost:3000`
- Back-office : `http://localhost:3001`
- Backend : `http://localhost:4000`

`pnpm dev` lance toutes les applications, mobile compris ; `pnpm dev:<app>` n'en lance qu'une (`backend`, `frontend` ou `back-office`). `pnpm db:dev:stop` arrête PostgreSQL et Redis.

`pnpm test` lance les tests sans infrastructure ; `pnpm test:cov` y ajoute la couverture et `pnpm test:watch` les relance en continu. Pour toutes les suites, lancer `pnpm db:test:start` (PostgreSQL sur le port 5433, Redis sur le port 6380), puis `pnpm test:all` ; `pnpm db:test:stop` arrête les ressources de test. L'intégration et les e2e du backend partagent la même base : lancer deux exécutions l'une après l'autre. `TEST_DATABASE_URL` et `TEST_REDIS_URL` ciblent d'autres ressources.

Pour la recette web isolée, lancer `pnpm recette:prepare`, puis `pnpm recette:web` (frontend, back-office et backend). Les apps sont accessibles sur 3100/3101 et le backend sur 4100. Après arrêt des serveurs, `pnpm db:recette:stop` arrête PostgreSQL et Redis de recette.

La seed crée deux comptes :

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| `admin` | `Password123` | `admin` (back-office) |
| `player` | `Password123` | `player` (frontend) |

Chaque pack porte un visuel, renseigné en collant le lien de l'image et
prévisualisé dans le formulaire et la liste des packs. Un pack sans visuel
s'enregistre mais ne se publie pas. Les apps joueur affichent le visuel en
carré et le remplacent par un visuel neutre s'il ne se charge pas.

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
pnpm db:dev:start
pnpm dev:mobile
```

Ouvrir `Cityborn (Dev)` sur le téléphone puis scanner le QR code affiché par Expo. En cas d'échec de connexion, vérifier que les ports `8081` (Metro) et `4000` (backend) sont accessibles (pare-feu, WSL).

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
│   └── design-system/   # Composants UI partagés
├── docs/                # Documentation technique
├── infra/               # Infrastructure
├── lint-rules/          # Règles Biome du monorepo (plugins GritQL)
└── scripts/             # Scripts du monorepo
```
