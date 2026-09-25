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

## Lancement

1. Démarrer PostgreSQL et Redis, puis appliquer les migrations :

   ```bash
   pnpm db:start
   pnpm db:up
   ```

2. Lancer la stack web (frontend, back-office, backend et packages) :

   ```bash
   pnpm dev:web
   ```

3. Arrêter les ressources locales avec `pnpm db:stop`.

## Mobile

L'application utilise des modules natifs : elle ne tourne pas dans Expo Go et nécessite un **dev build** (application `Cityborn (Dev)`) installé sur le téléphone. Le dev build n'est à réinstaller que lorsque le code natif ou les dépendances natives changent.

### 1. Configurer `apps/mobile/.env`

- Remplacer `<local_ip>` par l'IP locale de la machine (`ipconfig` / `ip addr`) : le téléphone appelle directement le backend.
- Renseigner les clés Google Maps et OAuth.

### 2. Récupérer un dev build

Les builds sont générés depuis GitHub Actions, en dispatch manuel (**Actions → workflow → Run workflow**) :

| Plateforme | Workflow | Environnement / profil | Artefact |
|---|---|---|---|
| Android | `Build Android App` | `development` / `development` | `.apk` |
| iOS | `Build iOS App` | `development` / `development` | `.ipa` |

L'artefact est téléchargeable en bas de la page du run (archive `.zip` à décompresser), il est conservé 14 jours.

### 3. Installer le dev build

**Android**

1. Transférer l'`.apk` sur le téléphone : câble, Google Drive, ou lien [Diawi](https://www.diawi.com) ouvert depuis le téléphone.
2. Ouvrir l'`.apk` et autoriser l'installation depuis des sources inconnues quand Android le demande.

Alternative sans GitHub Actions : `pnpm --dir apps/mobile build-android-development` génère l'`.apk` en local dans `apps/mobile/app-builds/` (SDK Android et JDK 17 requis).

**iOS**

Un dev build iOS ne s'installe que sur un appareil enregistré dans le profil de provisioning.

1. **Première fois uniquement** : demander à un admin d'enregistrer l'iPhone (`eas device:create`) et de régénérer le profil de provisioning, puis relancer le workflow `Build iOS App`.
2. Distribuer l'`.ipa`, par exemple via [Diawi](https://www.diawi.com) : téléverser le fichier, puis ouvrir le lien (ou scanner le QR code) **dans Safari** sur l'iPhone et installer.
3. Activer le mode développeur : **Réglages → Confidentialité et sécurité → Mode développeur**, puis redémarrer l'iPhone.

### 4. Lancer l'app

```bash
pnpm db:start
pnpm dev:mobile
```

`dev:mobile` lance Expo, le back-office, le backend et les packages. Ouvrir `Cityborn (Dev)` sur le téléphone puis scanner le QR code affiché par Expo (ou choisir le serveur détecté sur le réseau local).

En cas d'échec de connexion : vérifier que le téléphone et la machine sont sur le même réseau et que les ports `8081` (Metro) et `4000` (backend) sont accessibles (pare-feu, WSL).

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
