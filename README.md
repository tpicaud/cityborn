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

### Worktrees

Depuis un worktree secondaire, lancer la préparation avant de développer :

```bash
<checkout-principal>/scripts/setup-worktree.sh "$PWD"
```

Le checkout principal est la première entrée de `git worktree list`.
Le script conserve les `.env` déjà présents et copie seulement les manquants
ignorés par Git depuis ce checkout. Les `.env` des apps qui possèdent un
`.env.example` doivent ensuite être présents, sinon la préparation échoue.
Il exécute toujours `pnpm install`, même si `node_modules` existe déjà.
Un échec bloque le développement ; configurer les fichiers manquants ou corriger
l'installation, puis relancer. `--skip-install` permet seulement la copie et la
vérification des fichiers ; cette option ne valide pas la préparation complète.

Le workflow `deliver-issue` réutilise le worktree secondaire courant et y utilise
la branche liée à l'issue. Depuis le checkout principal, il réutilise le worktree
de cette branche ou en crée un, en préservant le principal. Une branche occupée
ailleurs depuis un worktree secondaire, ou des changements locaux dans le
worktree retenu, bloquent la préparation sans opération forcée.

## Lancement

1. Démarrer PostgreSQL et Redis, puis appliquer les migrations :

   ```bash
   pnpm db:start
   pnpm db:up
   ```

   Pour repartir d'une base locale propre, `pnpm db:reset` vide la base,
   réapplique les migrations puis lance la seed de développement
   (`apps/backend/prisma/seed/`). Relancée seule avec
   `pnpm backend exec prisma db seed`, la seed met à jour ses données sans
   créer de doublon. Elle crée un thème avec deux packs publiés de deux
   personnalités chacun, et deux comptes vérifiés :

   | Identifiant | Mot de passe | Rôle |
   |---|---|---|
   | `admin` | `Password123` | `admin` (back-office) |
   | `player` | `Password123` | `player` (frontend) |

   La seed ne tourne jamais en staging ni en production : `db:up` et `start`
   n'appliquent que les migrations.

2. Lancer la stack web (frontend, back-office et backend) :

   ```bash
   pnpm dev:web
   ```

   `pnpm dev` lance toutes les applications, mobile compris. Pour une seule
   application, utiliser `pnpm <app>:dev` (`backend`, `frontend`, `back-office`
   ou `mobile`). Chaque commande lance aussi les packages dont dépendent les
   applications visées, après avoir compilé ceux qui en ont besoin.

   Le frontend est disponible sur `http://localhost:3000` et le back-office sur
   `http://localhost:3001`. Ces ports viennent de la variable `PORT` du `.env`
   de chaque application. Le navigateur appelle directement le backend Nest à
   l'URL `NEXT_PUBLIC_REST_BACKEND_URL` configurée dans `apps/frontend/.env` et
   `apps/back-office/.env` (`http://localhost:4000` par défaut). Le frontend
   ouvre le WebSocket à `NEXT_PUBLIC_WEBSOCKET_BACKEND_URL` (`ws://localhost:4000`
   par défaut) : cette URL doit désigner le même nom d'hôte que l'API REST, car
   les cookies d'authentification ne sont envoyés qu'à cet hôte. Le backend
   autorise l'origine du frontend via `CORS_ORIGIN` et celle du back-office via
   `BACK_OFFICE_ORIGIN` ; les deux sont obligatoires en production.

3. Arrêter les ressources locales avec `pnpm db:stop`.

## Accès au back-office

Le back-office se connecte avec un compte Cityborn de rôle `admin`. En local, la
seed fournit le compte `admin` décrit plus haut. Un compte est
créé avec le rôle `player`. Ne promouvoir qu'un compte dont l'email est vérifié
et dont la personne a confirmé être à l'origine de la création, puis exécuter sur
la base concernée :

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com' AND "isVerified" = true;
```

La base refuse le rôle `admin` sur un compte non vérifié, et le backend refuse
l'accès admin à un compte non vérifié.

Pour retirer le rôle et fermer les sessions ouvertes du compte :

```sql
UPDATE "User" SET role = 'player', "authVersion" = "authVersion" + 1 WHERE email = 'admin@example.com';
```

Le backend applique le changement de rôle dès la requête suivante ; recharger le
back-office suffit à mettre à jour l'interface. Un compte `player` connecté au
back-office voit un message d'accès refusé.

Le dashboard propose les sections Packs et Thèmes. Les administrateurs peuvent
créer et renommer les thèmes, consulter leur nombre de packs et supprimer les
thèmes inutilisés ; le thème par défaut reste protégé même après renommage.

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

`dev:mobile` lance Expo, le back-office et le backend. Pour utiliser les raccourcis clavier d'Expo, sélectionner sa tâche dans l'interface de turbo puis appuyer sur `i` (`Ctrl+Z` pour en sortir). Ouvrir `Cityborn (Dev)` sur le téléphone puis scanner le QR code affiché par Expo (ou choisir le serveur détecté sur le réseau local).

En cas d'échec de connexion : vérifier que le téléphone et la machine sont sur le même réseau et que les ports `8081` (Metro) et `4000` (backend) sont accessibles (pare-feu, WSL).

## Architecture

### Compatibilité de l'API

`pnpm check:api-compat` compare les contrats HTTP et WebSocket aux versions
encore supportées avec oasdiff 1.26.1, également requis par les tests de
`packages/api`. Installer ce binaire sur le `PATH` avant de lancer ces commandes.
Les erreurs et avertissements oasdiff non acceptés font échouer le contrôle ; les
exceptions historiques de `accepted-changes.json` restent visibles dans les
sorties avec leur justification. Le contrôle complète oasdiff pour détecter un
payload d'entrée qui passe à `additionalProperties: false`.

Les commandes `generate:openapi:draft` et `generate:openapi:release` de
`packages/api` versionnent ensemble `v<n>-api.json` et `v<n>-ws.json` dès que
l'un des contrats change. Le manifeste commun porte uniquement le numéro de
version, la date, le statut draft et les éventuelles informations de dépréciation ;
les deux noms de fichiers se déduisent du numéro de version. Les captures partagent
la même politique de support. Les captures WebSocket réelles commencent à la v6 ;
les versions v1 à v5 contiennent des documents vides explicitement marqués comme synthétiques, car
aucune capture WebSocket n’existait alors. Ces documents ne représentent pas
les contrats historiques et suivent le même contrôle que les autres captures.
Le contrôle reste structurel : une réponse de même forme dont le contenu ou le
comportement change exige toujours une review. Le handshake et le sens métier des
messages restent eux aussi hors du contrôle automatique.

### Organisation

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

[Réinitialisation du mot de passe](docs/password-reset.md).
