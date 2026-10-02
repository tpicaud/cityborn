---
name: client-app-architecture
description: Architecture client Cityborn. À utiliser pour placer ou modifier une feature, un composant, un hook, le routing, un accès API, un port plateforme ou un domaine @cityborn/client dans les apps front et mobile.
---

# Architecture client

`apps/frontend`, `apps/back-office` et `apps/mobile` suivent les mêmes frontières par domaine, mais pas la même arborescence physique. Appliquer la convention de l'app touchée. Une modification locale n'autorise pas une migration générale vers une autre structure.

## Arborescences des apps

| App | Routing | Capacité métier | Transverse et infrastructure |
|---|---|---|---|
| `apps/frontend` | `src/app/` | `src/features/<domaine>/` | `src/components/ui/`, `src/hooks/`, `src/contexts/`, `src/lib/`, `src/server/` |
| `apps/back-office` | `app/` | `components/<capacité>/` | `components/ui/`, `hooks/`, `lib/`, `server/` |
| `apps/mobile` | `app/` | `features/<domaine>/` | `components/ui/`, `lib/` |

Les dossiers de routing portent les pages, layouts, erreurs, providers et autres points d'entrée du framework. La logique du domaine vit dans le dossier de capacité de l'app.

Pour le frontend, les composants métier et services encore placés hors de `src/features/` sont du code existant, pas un second modèle à reproduire. Placer une nouvelle capacité dans `src/features/<domaine>/`. Déplacer du code existant seulement lorsque la tâche touche toute la capacité et que le déplacement reste cohérent avec son périmètre.

Le back-office ne possède pas de dossier `features/`. Regrouper son UI métier dans `components/<capacité>/` jusqu'à une migration explicitement demandée, sans introduire seul un nouvel arbre parallèle.

Avant de créer un fichier, inspecter les voisins dans l'arborescence de l'app concernée. Préférer étendre un fichier existant si sa responsabilité reste cohérente. Demander seulement si plusieurs emplacements impliquent des responsabilités architecturales différentes.

## Accès à l'API

- **Mobile** → `apps/mobile/lib/api/`.
- **Frontend Next** → `apps/frontend/src/server/`.
- **Back-office Next** → `apps/back-office/server/`.

Dans les deux apps Next, séparer :

- `server/use-server/` — server actions (`'use server'`), wrappées par `toApiResult` → renvoient un `ApiResult<T>`.
- `server/server-only/` — loaders de Server Components (`server-only`), wrappés par `unwrapApiResponse` → renvoient le body typé ou `throw`.

L'authentification du frontend public et du mobile fait exception : ses appels HTTP vivent dans `createAuthApi` (`@cityborn/client/auth`). Le mobile l'instancie dans `lib/api/auth.ts` avec son `TokenStorage` ; le frontend l'obtient par `getServerAuthApi()`, ses server actions restant des passe-plats. Le navigateur authentifié par cookies Nest utilise `createCookieAuthApi`, sans `TokenStorage`. Ajouter un appel à cette API d'auth se fait dans `AuthApi`, jamais dans une app. L'authentification propre au back-office reste locale tant qu'aucune migration n'est demandée.

Les sessions suivent le même principe avec un port : les hooks de `@cityborn/client/session` reçoivent un `SessionApi`. Le mobile l'obtient par `createSessionApi(client)` (`lib/api/session.ts`) ; le frontend l'implémente dans `src/lib/sessionApi.ts` avec ses server actions pour garder ses appels côté serveur. Le port est un objet de module, donc d'identité stable : les hooks le prennent en dépendance d'effet.

Pour tout ce qui touche à la gestion / l'affichage des erreurs de ces wrappers, voir le skill `client-error-handling`.

## Routing

`apps/frontend/src/app/`, `apps/back-office/app/` et `apps/mobile/app/` restent des surfaces de routing. Les fichiers de route assemblent la capacité correspondante ; ses règles, son état et ses composants métier restent dans son dossier propriétaire décrit plus haut.

## `@cityborn/client` : logique partagée front + mobile

Rangé par domaine, en miroir des capacités fonctionnelles des apps. Chaque domaine expose un `index.ts` unique atteint par un sous-chemin ; ce qu'un `index.ts` n'exporte pas est privé au package. Il n'y a pas de barrel racine : l'`exports` map de `packages/client/package.json` est la surface publique.

| Sous-chemin | Dossier | Contenu |
|---|---|---|
| `@cityborn/client` | `src/shared/` | Le réellement transverse : `ErrorProvider`, version d'API minimale supportée, formatage de date. |
| `@cityborn/client/api` | `src/api/` | Transport HTTP : `AuthFetch`, `createApiClient` (bearer) / `createCookieApiClient` (cookies), visitorId. Sans React. |
| `@cityborn/client/ws` | `src/ws/` | Transport WS : `createWsEmit`, qui valide le corps sortant et l'enveloppe d'ack du contrat `@cityborn/api` et rejette à l'expiration du délai d'accusé. Sans React. |
| `@cityborn/client/auth` | `src/features/auth/` | Flow d'authentification complet : `createAuthApi`, `AuthProvider`, hooks de formulaire headless. |
| `@cityborn/client/session` | `src/features/session/` | Sessions solo et multi : contrat `SessionController`, port `SessionApi`, hooks `useSoloSession` / `useMultiSession`, lobby (`useCategorySelection`) et création / jonction (`useSessionLauncher`). Le transport (`useSocket`) et les transitions (`sessionState`) restent privés au domaine. |
| `@cityborn/client/game` | `src/features/game/` | État d'affichage de la partie, flow de round, résultats, hook `useGameRound` et contrats de props (`MapProps`, `GameComponentProps`). |
| `@cityborn/client/play` | `src/features/play/` | Hook `usePlay` : formulaire de jonction, lancement solo / multi et garde d'authentification. |
| `@cityborn/client/profile` | `src/features/profile/` | Port `ProfileApi`, projection des parties du profil et hook `useProfile`. |
| `@cityborn/client/platform` | `src/platform/` | Ports plateforme (ci-dessous). |

Un nouveau domaine se crée en ajoutant `src/features/<domaine>/index.ts` **et** son entrée dans l'`exports` map. Un type ou un helper vit dans son domaine ; `src/shared/` ne reçoit que ce qui sert à plusieurs domaines.

La logique de présentation suit les conventions React existantes : un hook headless porte le nom `use<Comportement>` (`useSoloSession`, `useGameRound`, `useProfile`) ; une transformation pure porte le nom précis de son résultat (`gameDisplay`, `gameResult`, `sessionState`). Les contrats de vue restent colocalisés dans leur domaine.

### Ports plateforme

Le package reste agnostique de Next, Expo, React Native et du rendu. Chaque besoin plateforme est un port typé dans `src/platform/`, implémenté dans le `lib/` de chaque app qui le consomme, puis injecté.

| Port | Implémenté avec |
|---|---|
| `TokenStorage` | cookies `httpOnly` côté frontend Next, `expo-secure-store` côté mobile. |
| `KeyValueStorage` | `localStorage` côté web, `AsyncStorage` côté mobile. Stocke des chaînes : le domaine décode ce qu'il a écrit. |
| `SocketConnection` / `SocketFactory` | `socket.io-client`. La factory est asynchrone car le mobile lit le token avant d'ouvrir la socket. |
| `Navigation` | `useRouter` de `next/navigation` ou d'`expo-router`. |

`packages/client/biome.json` fait échouer `pnpm format:check` sur un import de `next/*`, `expo-*`, `react-native*`, `react-dom` ou `@cityborn/design-system` dans le package. Quand la règle se déclenche, déclarer un port et l'implémenter dans l'app.

### Où placer un comportement partagé

| Critère | Emplacement |
|---|---|
| transite par l'API | `@cityborn/api` |
| logique pure aussi utile au backend | `@cityborn/core` |
| dépend de React, pas de la plateforme | `@cityborn/client`, dans son domaine |
| dépend de `next`, `expo`, `react-native`, `react-dom` ou du rendu | l'app, derrière un port `@cityborn/client/platform` |

## Critère de fin

- Chaque nouveau fichier appartient à un domaine et respecte l'arborescence de son app.
- Le code partagé suit la frontière `api` / `core` / `client` / app.
- `@cityborn/client` reste agnostique des plateformes.
- Tout nouveau sous-chemin public figure dans l'`exports` map.
- Les déplacements architecturaux restent limités à la capacité réellement touchée.
