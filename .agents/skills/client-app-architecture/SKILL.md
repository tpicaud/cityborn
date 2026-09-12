---
name: client-app-architecture
description: Architecture client Cityborn. À utiliser pour placer ou modifier une feature, un composant, un hook, le routing ou un accès API dans apps/frontend, apps/back-office ou apps/mobile.
---

# Structure d'une app cliente (front & mobile)

Front (`apps/frontend`, `apps/back-office`) et mobile (`apps/mobile`) suivent la même organisation par domaine. Pour un domaine réellement partagé, vérifier leur cohérence sans élargir le périmètre demandé.

## Organisation par domaine

| Dossier | Contenu |
|---|---|
| `features/<domaine>/` | Un dossier par domaine fonctionnel : composant d'entrée + `components/` + `hooks/` locaux. C'est ici que va le gros du code. |
| `components/ui/` | Composants UI génériques réutilisables, propres à l'app (hors `@cityborn/design-system`). |
| `lib/` | Intégrations transverses bas niveau : socket, storage du token, visitorId, client API. |
| `contexts/`, `hooks/` | React transverse à plusieurs domaines. |

Avant de créer un fichier, inspecter les fichiers voisins et suivre le précédent dominant. Préférer étendre un fichier existant si sa responsabilité reste cohérente. Demander seulement si plusieurs emplacements impliquent des responsabilités architecturales différentes.

## Accès à l'API

- **Mobile** → `lib/api/`.
- **Next** → `src/server/` :
  - `server/use-server/` — server actions (`'use server'`), wrappées par `toApiResult` → renvoient un `ApiResult<T>`.
  - `server/server-only/` — loaders de Server Components (`server-only`), wrappés par `unwrapApiResponse` → renvoient le body typé ou `throw`.

L'authentification fait exception : ses appels HTTP vivent dans `createAuthApi` (`@cityborn/client/auth`). Chaque app se contente de l'instancier avec son `TokenStorage` — `lib/api/auth.ts` côté mobile, `getServerAuthApi()` côté Next, les server actions n'étant que des passe-plats. Ajouter un appel d'auth se fait dans `AuthApi`, jamais dans une app.

Pour tout ce qui touche à la gestion / l'affichage des erreurs de ces wrappers, voir le skill `client-error-handling`.

## Spécifique Next (App Router)

`src/app/` = routing uniquement : `layout.tsx`, `page.tsx`, `error.tsx`, `providers.tsx`, `api/`. Pas de logique de domaine ici — elle vit dans `features/`.

## `@cityborn/client` : logique partagée front + mobile

Rangé par domaine, en miroir des `features/` des apps. Chaque domaine expose un `index.ts` unique atteint par un sous-chemin ; ce qu'un `index.ts` n'exporte pas est privé au package. Il n'y a pas de barrel racine : l'`exports` map de `packages/client/package.json` est la surface publique.

| Sous-chemin | Dossier | Contenu |
|---|---|---|
| `@cityborn/client` | `src/shared/` | Le réellement transverse : `ErrorProvider`, version d'API minimale supportée, formatage de date. |
| `@cityborn/client/api` | `src/api/` | Transport : `AuthFetch`, `createApiClient`, visitorId. Sans React. |
| `@cityborn/client/auth` | `src/features/auth/` | Flow d'authentification complet : `createAuthApi`, `AuthProvider`, hooks de formulaire headless. |
| `@cityborn/client/session` | `src/features/session/` | Sessions solo et multi. |
| `@cityborn/client/game` | `src/features/game/` | Partie en cours, résultats, contrats de props (`MapProps`, `GameComponentProps`). |
| `@cityborn/client/platform` | `src/platform/` | Ports plateforme (ci-dessous). |

Un nouveau domaine se crée en ajoutant `src/features/<domaine>/index.ts` **et** son entrée dans l'`exports` map. Un type ou un helper vit dans son domaine ; `src/shared/` ne reçoit que ce qui sert à plusieurs domaines.

### Ports plateforme

Le package reste agnostique de Next, Expo, React Native et du rendu. Chaque besoin plateforme est un port typé dans `src/platform/`, implémenté par chaque app dans son `lib/` et injecté.

| Port | Implémenté avec |
|---|---|
| `TokenStorage` | cookies `httpOnly` côté Next, `expo-secure-store` côté mobile. |
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
