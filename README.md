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
pnpm db:start   # PostgreSQL et Redis
pnpm db:reset   # base vidée, migrations et seed de développement
pnpm dev:web    # frontend, back-office et backend
```

`pnpm db:up` applique les nouvelles migrations sans vider la base.

- Frontend : `http://localhost:3000`
- Back-office : `http://localhost:3001`
- Backend : `http://localhost:4000`

`pnpm dev` lance toutes les applications, mobile compris ; `pnpm <app>:dev` n'en lance qu'une (`backend`, `frontend`, `back-office` ou `mobile`). `pnpm db:stop` arrête PostgreSQL et Redis.

`pnpm test` lance les tests sans infrastructure. Pour toutes les suites, lancer `pnpm db:test:start`, puis `pnpm test:all` ; `pnpm db:test:stop` arrête les ressources de test. Voir [les commandes de test](docs/testing.md).

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

- **Android** : autoriser l'installation depuis des sources inconnues. Alternative locale : `pnpm --dir apps/mobile build-android-development` (SDK Android et JDK 17 requis).
- **iOS** : la première fois, demander à un admin d'enregistrer l'iPhone (`eas device:create`) puis relancer le workflow. Ouvrir le lien dans Safari, puis activer **Réglages → Confidentialité et sécurité → Mode développeur** et redémarrer.

### 3. Lancer l'app

```bash
pnpm db:start
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
