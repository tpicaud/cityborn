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
| `lib/` | Adaptateurs de plateforme : socket, storage du token, visitorId, client API, gateways, navigation. |
| `contexts/`, `hooks/` | React transverse à plusieurs domaines **et non partageable** avec l'autre plateforme. |

Avant de créer un fichier, inspecter les fichiers voisins et suivre le précédent dominant. Préférer étendre un fichier existant si sa responsabilité reste cohérente. Demander seulement si plusieurs emplacements impliquent des responsabilités architecturales différentes.

## Frontière avec `@cityborn/client`

`@cityborn/client` porte la logique applicative partagée front + mobile. **Aucun import de plateforme** n'y est autorisé : ni `next/*`, ni `expo-*`, ni `react-native`, ni `socket.io-client`, ni `process.env`, ni `localStorage` / `AsyncStorage`.

Ce qui vit dans le package, par domaine :

| Domaine | Contenu |
|---|---|
| `auth` | schémas et valeurs par défaut de formulaire, `AuthProvider` / `useAuth` |
| `play` | `JoinSessionSchema`, `usePlayActions` (solo / multi / rejoindre par code) |
| `session` | `SessionController`, protocole socket de session, `useSoloSession`, `useMultiSession`, `useSessionSocket` |
| `game` | `useGuess`, `useGuessRound`, transitions de round, sélecteurs de résultats, `MapProps` |
| `lobby` | navigation dans l'arbre de catégories, `useCategoryTrees`, `useCategorySelection` |
| `profile` | view models de `GameRecord`, `useGameRecords` |
| `infrastructure` | `ErrorProvider` / `useError`, visitor ID, version d'API minimale, formatage de date |
| `api` | `AuthFetch` et `createApiClient` (ts-rest) |
| `ports` | interfaces que les apps implémentent (voir ci-dessous) |

Ce qui reste dans l'app : navigation, Server Actions, stockage, variables d'environnement, SDK natifs et rendu — exposés au package via des **adaptateurs typés** dans `lib/`.

### Ports

Les hooks partagés ne connaissent que ces interfaces (`@cityborn/client/ports`) :

- `SessionGateway`, `CategoryGateway`, `UserGateway`, `AuthGateway` — accès HTTP ;
- `SocketConnection` / `SocketConnectionFactory` — socket, construite à partir du `socket.io-client` de l'app ;
- `SessionNavigation`, `PlayNavigation` — navigation ;
- `TokenStorage`, `KeyValueStorage` — stockage.

Chaque app fournit ses implémentations depuis `lib/gateways.ts`, `lib/navigation.ts`, `lib/socket.ts`, `lib/tokenStorage.ts`. **Les gateways doivent être des constantes de module** : ils entrent dans les dépendances d'effets des hooks partagés.

### Imports

Le package n'a **pas de barrel global** : importer par sous-chemin, et ne jamais mélanger code pur et modules React.

```typescript
import { flattenCategoryTree } from '@cityborn/client/lobby';        // pur
import { useCategorySelection } from '@cityborn/client/lobby/react'; // React
```

Sous-chemins disponibles : `api`, `ports`, `infrastructure`, `auth`, `session`, `game`, `lobby`, `play`, `profile`, chacun doublé d'un `<domaine>/react` quand il expose des hooks ou des providers. Ajouter un sous-chemin = ajouter une entrée dans `exports` de `packages/client/package.json`.

### Gestion des erreurs des hooks de session

Les commandes de `SessionController` (`startGame`, `guess`, `nextRound`, `endGame`, `playAgain`, `exitGame`, `updateGameConfig`) **ne rejettent jamais** : elles remontent l'erreur via `useError`. Les appeler directement, sans `try/catch`. Seuls `join`, `reconnect`, `updateHost` et `kickPlayer` rejettent, pour que l'appelant réagisse au résultat.

## Accès à l'API

- **Mobile** → `lib/api/`.
- **Next** → `src/server/` :
  - `server/use-server/` — server actions (`'use server'`), wrappées par `toApiResult` → renvoient un `ApiResult<T>`.
  - `server/server-only/` — loaders de Server Components (`server-only`), wrappés par `unwrapApiResponse` → renvoient le body typé ou `throw`.

Pour tout ce qui touche à la gestion / l'affichage des erreurs de ces wrappers, voir le skill `client-error-handling`.

## Spécifique Next (App Router)

`src/app/` = routing uniquement : `layout.tsx`, `page.tsx`, `error.tsx`, `providers.tsx`, `api/`. Pas de logique de domaine ici — elle vit dans `features/`.
