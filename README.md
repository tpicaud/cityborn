# Cityborn

Cityborn est un jeu de géographie où l'on devine le lieu de naissance de personnalités. Le projet regroupe ses applications web, mobile et backend dans un monorepo TypeScript.

## Prérequis

- Node.js 24
- pnpm 10.33.2
- Docker
- Pour le mobile : un environnement Expo compatible

## Installation

```bash
pnpm install

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/back-office/.env.example apps/back-office/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Renseigner ensuite les variables requises dans les fichiers `.env`. Pour le mobile, remplacer `<local_ip>` par l'adresse IP locale de la machine.

## Lancement

Démarrer PostgreSQL et Redis, puis appliquer les migrations :

```bash
pnpm db:start
pnpm db:up
```

Lancer la stack web (frontend, back-office, backend et packages) :

```bash
pnpm dev:web
```

Ou la stack mobile (Expo, back-office, backend et packages) :

```bash
pnpm dev:mobile
```

Arrêter les ressources locales avec `pnpm db:stop`.

## Architecture

```text
cityborn/
├── apps/
│   ├── backend/         # API NestJS, Prisma et WebSocket
│   ├── frontend/        # Application web Next.js
│   ├── back-office/     # Administration Next.js
│   └── mobile/          # Application Expo / React Native
├── packages/
│   ├── api/             # Contrats API, schémas et types partagés
│   ├── client/          # Code partagé entre les clients
│   ├── core/            # Logique partagée backend et clients
│   └── design-system/   # Composants UI partagés
├── docs/                # Documentation technique
├── infra/               # Infrastructure
└── scripts/             # Scripts du monorepo
```
