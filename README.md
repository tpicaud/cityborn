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

   Le frontend est disponible sur `http://localhost:3000` et le back-office sur
   `http://localhost:3001`. Ces ports viennent de la variable `PORT` du `.env`
   de chaque application.

3. Arrêter les ressources locales avec `pnpm db:stop`.

## Mobile

L'application utilise des modules natifs : elle ne tourne pas dans Expo Go et nécessite un **dev build** (application `Cityborn (Dev)`) installé sur le téléphone. Le dev build n'est à réinstaller que lorsque le code natif ou les dépendances natives changent.

### 1. Configurer `apps/mobile/.env`

- Remplacer `<local_ip>` par l'IP locale de la machine (`ipconfig` / `ip addr`) : le téléphone appelle directement le backend.
- Renseigner les clés Google Maps et OAuth.

### 2. Récupérer un dev build

Les builds sont générés depuis GitHub Actions, en dispatch manuel (**Actions → workflow → Run workflow**) :

| Plateforme | Workflow | Environnement / profil |
|---|---|---|
| Android | `Build Android App` | `development` / `development` |
| iOS | `Build iOS App` | `development` / `development` |

Le build tourne sur le runner GitHub puis est envoyé sur EAS (`eas upload`). Le lien d'installation s'affiche dans le résumé du run et le build apparaît dans l'onglet **Builds** du projet sur expo.dev. Le binaire reste aussi disponible en artefact du run pendant 14 jours.

### 3. Installer le dev build

Ouvrir le lien d'installation sur le téléphone (ou scanner le QR code de la page du build) et suivre les instructions.

**Android** : autoriser l'installation depuis des sources inconnues quand Android le demande.

Alternative sans GitHub Actions : `pnpm --dir apps/mobile build-android-development` génère l'`.apk` en local dans `apps/mobile/app-builds/` (SDK Android et JDK 17 requis).

**iOS**

Un dev build iOS ne s'installe que sur un appareil enregistré dans le profil de provisioning.

1. **Première fois uniquement** : demander à un admin d'enregistrer l'iPhone (`eas device:create`), puis relancer le workflow `Build iOS App` : il régénère le profil de provisioning avec les appareils enregistrés.
2. Ouvrir le lien d'installation **dans Safari** sur l'iPhone et installer.
3. Activer le mode développeur : **Réglages → Confidentialité et sécurité → Mode développeur**, puis redémarrer l'iPhone.

### 4. Lancer l'app

```bash
pnpm db:start
pnpm dev:mobile
```

`dev:mobile` lance Expo, le back-office, le backend et les packages. Ouvrir `Cityborn (Dev)` sur le téléphone puis scanner le QR code affiché par Expo (ou choisir le serveur détecté sur le réseau local).

En cas d'échec de connexion : vérifier que le téléphone et la machine sont sur le même réseau et que les ports `8081` (Metro) et `4000` (backend) sont accessibles (pare-feu, WSL).

Pour tester la réinitialisation du mot de passe, garder `FRONTEND_URL=http://localhost:3000` dans `apps/backend/.env`. Avec `pnpm dev:mobile` en cours, lancer le frontend depuis la racine du projet dans un autre terminal :

```bash
pnpm frontend:dev
```

1. Depuis l’application mobile, ouvrir « Mot de passe oublié ? » et demander le lien.
2. Ouvrir l’e-mail sur l’ordinateur de développement, puis suivre le lien pour changer le mot de passe sur `http://localhost:3000`.
3. Revenir dans l’application mobile et vérifier que le nouveau mot de passe permet de se connecter et que l’ancien est refusé.

Si le frontend tourne déjà avec `pnpm frontend:dev`, le conserver. Après modification de `FRONTEND_URL`, redémarrer le backend et demander un nouveau lien. L’IP locale reste nécessaire dans la configuration mobile pour joindre le backend ; le lien de réinitialisation de cette recette s’ouvre sur l’ordinateur de développement.

Les e-mails utilisent la configuration Brevo existante. Voir la [recette de réinitialisation du mot de passe](docs/password-reset.md).

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
