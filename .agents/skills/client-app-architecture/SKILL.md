---
name: client-app-architecture
description: Architecture client Cityborn. À utiliser pour placer ou modifier une feature, un composant, un hook, le routing, un accès API, un port plateforme ou un domaine @cityborn/client dans les apps front et mobile.
---

# Architecture client

`apps/frontend`, `apps/back-office` et `apps/mobile` suivent les mêmes frontières par domaine, mais pas la même arborescence physique. Appliquer la convention de l'app touchée. Une modification locale n'autorise pas une migration générale vers une autre structure.

## Arborescences des apps

| App | Routing | Capacité métier | Transverse et infrastructure |
|---|---|---|---|
| `apps/frontend` | `src/app/` | `src/features/<domaine>/` | `src/components/ui/`, `src/hooks/`, `src/contexts/`, `src/lib/` |
| `apps/back-office` | `app/` | `components/<capacité>/` | `components/ui/`, `lib/` |
| `apps/mobile` | `app/` | `features/<domaine>/` | `components/ui/`, `lib/` |

Les dossiers de routing portent les pages, layouts, erreurs, providers et autres points d'entrée du framework. La logique du domaine vit dans le dossier de capacité de l'app.

Pour le frontend, les composants métier et services encore placés hors de `src/features/` sont du code existant, pas un second modèle à reproduire. Placer une nouvelle capacité dans `src/features/<domaine>/`. Déplacer du code existant seulement lorsque la tâche touche toute la capacité et que le déplacement reste cohérent avec son périmètre.

Le back-office ne possède pas de dossier `features/`. Regrouper son UI métier dans `components/<capacité>/` jusqu'à une migration explicitement demandée, sans introduire seul un nouvel arbre parallèle.

Avant de créer un fichier, inspecter les voisins dans l'arborescence de l'app concernée. Préférer étendre un fichier existant si sa responsabilité reste cohérente. Demander seulement si plusieurs emplacements impliquent des responsabilités architecturales différentes.

### Miroir frontend / mobile

Le frontend et le mobile visent le miroir : une capacité présente dans les deux apps y a le même découpage (composants, hooks de `@cityborn/client`, providers, enchaînement des écrans), et un changement destiné aux deux y est fait de la même façon. L'implémentation propre à la plateforme (rendu, navigation, stockage, ports de `@cityborn/client/platform`) diffère naturellement.

- Un composant présent dans les deux apps porte le même nom de fichier, celui de son concept sans suffixe `Component` (`Map.tsx`, `SignInForm.tsx`) ; aligner ce nom quand la tâche modifie le composant.
- Le miroir est la cible, pas un absolu. Quand la techno ou la plateforme rend l'implémentation miroir moins bonne pour une app (API native, cycle de vie, ergonomie), choisir pour chaque app l'implémentation adaptée, garder dans `@cityborn/client` ce qui reste commun, et nommer l'écart avec sa raison dans la PR.

## Accès à l'API

- **Frontend joueur** → `apps/frontend/src/lib/api/`, exécuté dans le navigateur avec les cookies Nest.
- **Mobile** → `apps/mobile/lib/api/`, exécuté avec les tokens du stockage sécurisé.
- **Back-office** → `apps/back-office/lib/api/`, exécuté dans le navigateur avec les cookies Nest ; ses routes `admin` exigent un compte de rôle `admin`.

`ContractClient` est le client HTTP ts-rest construit depuis le contrat complet : `createBearerContractClient` utilise un `TokenStorage`, `createCookieContractClient` utilise les cookies Nest. Chaque app crée dans son `lib/api/` son `contractClient` et son `authApi`, puis les passe à `ApiProvider` (`@cityborn/client`). Ce provider unique crée le `QueryClient`, construit les autres API de domaine (`createCategoryApi`, `createHealthApi`, `createSessionApi`, `createProfileApi`) et les expose par contexte : un hook lit ses ports par `useDomainApis()`, jamais en paramètre. Créer un port pour une capacité partagée ou une transformation métier, pas automatiquement pour chaque controller Nest.

Ordre des providers dans chaque app : `ErrorProvider`, puis `ApiProvider`, puis `AuthProvider`. `ApiProvider` lit `invokeError` pour créer la `QueryCache` qui remonte les erreurs de query.

L'authentification vit dans `AuthApi` (`@cityborn/client/auth`) : le mobile instancie `createAuthApi(contractClient, tokenStorage)`, le navigateur `createCookieAuthApi(contractClient)`. Ajouter un appel d'auth dans ce port. `getCurrentUser()` renvoie `null` en l'absence de session ou après un refus 401 ; les erreurs techniques sont propagées.

L'utilisateur courant a une seule source : la query de `auth/api/authQueries.ts`.

- L'écran de garde de chaque app (`AuthBootstrap` front, `auth-bootstrap` back-office, `app/_layout.tsx` mobile) lit son statut par `useCurrentUserLoad` : chargement, échec avec « Réessayer », ou utilisateur prêt passé à `AuthProvider`. Sous la garde, `useAuth()` expose `User | null`.
- Une écriture met la query à jour : `setCurrentUser` après une connexion ou une modification du compte, `invalidateCurrentUser` après la vérification de l'e-mail, `refreshCurrentUser` pour forcer l'appel réseau (rafraîchissement d'auth du WS).
- La déconnexion passe par `useSignOut` : elle retire les données du compte du cache puis met l'utilisateur à `null`, sans repasser par l'écran de chargement.
- Un rafraîchissement en échec conserve l'utilisateur courant.

Un hook de domaine signale lui-même les erreurs de ses actions via `invokeError` : l'app branche ses actions directement sur la vue, et seule la vue reste dans l'app.

Le back-office instancie aussi `createCookieAuthApi` ; `AdminAccessGuard` (`components/auth/`) redirige vers `/login` sans utilisateur et réserve ses pages au rôle `admin`.

Pour tout ce qui touche à la gestion / l'affichage des erreurs de ces wrappers, voir le skill `client-error-handling`.

## Routing

`apps/frontend/src/app/`, `apps/back-office/app/` et `apps/mobile/app/` restent des surfaces de routing. Les fichiers de route assemblent la capacité correspondante ; ses règles, son état et ses composants métier restent dans son dossier propriétaire décrit plus haut.

### Export statique

Le frontend joueur et le back-office sont exportés en statique (`output: 'export'`), sans code serveur Next : chaque page charge ses données dans le navigateur, et un paramètre de requête se lit avec `useSearchParams()` sous une `Suspense`. Une URL à identifiant (`/session/multi/<id>`) sert une page sans segment dynamique, atteinte par une réécriture dans `next.config.ts` (dev) et `vercel.json`. La page lit l'identifiant avec `usePathname()` et le parseur colocalisé avec le constructeur du chemin (`sessionIdFromMultiSessionPath`).

## `@cityborn/client` : logique partagée front + mobile

Rangé par domaine, en miroir des capacités fonctionnelles des apps. Il n'y a pas de barrel racine : l'`exports` map de `packages/client/package.json` est la surface publique.

- Un domaine consommé par les apps expose un `index.ts` unique atteint par un sous-chemin ; ce que son `index.ts` n'exporte pas est privé au package.
- Un domaine consommé seulement à l'intérieur du package (`category`) n'a ni `index.ts` ni sous-chemin : ses consommateurs importent directement ses fichiers.

| Sous-chemin | Dossier | Contenu |
|---|---|---|
| `@cityborn/client` | `src/shared/` | Le réellement transverse : `ApiProvider`, `ErrorProvider` et `ErrorDialogProps`, version d'API minimale supportée, formatage de date. |
| `@cityborn/client/api` | `src/api/` | Transport HTTP : `AuthFetch`, `createBearerContractClient` (bearer) / `createCookieContractClient` (cookies), `createVisitorIdProvider` sur le `KeyValueStorage` de l'app. Sans React. |
| `@cityborn/client/ws` | `src/ws/` | Transport WS : `createBearerSocketFactory` / `createCookieSocketFactory`, seul adaptateur `socket.io-client` ; l'app ne fournit que l'URL, son `TokenStorage` et son visitorId. Chaque appel rend une `SocketConnection` neuve et non connectée, possédée par `useSocket` : seuls `useSocket` et `superviseWsConnection` appellent `connect` / `disconnect`. `createWsEmit`, qui valide le corps sortant et l'enveloppe d'ack du contrat `@cityborn/api`, résout avec les données d'ack typées (`WsAckSuccessOf`) et rejette à l'expiration du délai d'accusé ; `superviseWsConnection`, privé au package, qui porte le cycle de vie de la connexion indépendamment des features (statut `connecting | connected | reconnecting | closed`, reconnexion après une déconnexion serveur, rafraîchissement d'auth sur rejet du handshake, une seule erreur par séquence ratée) et rejoue à chaque `connect` la restauration fournie par la feature. Sans React. |
| `@cityborn/client/auth` | `src/features/auth/` | Flow d'authentification complet : `createAuthApi`, `AuthProvider`, chargement de l'utilisateur courant, connexion, inscription, déconnexion, vérification et renvoi de l'e-mail de vérification. |
| `@cityborn/client/session` | `src/features/session/` | Sessions solo et multi : contrat `SessionController` (joueur local compris), hooks `useSoloSession` / `useMultiSession`, lobby (`useCategorySelection` lit les arbres de catégories par la query de `src/features/category/`, domaine privé sans sous-chemin ; `usePlayerNameForm`, `sortPlayersConnectedFirst`) et création / jonction (`useSessionLauncher`). La liaison React du socket (`useSocket`, qui restaure la session à chaque `connect`) et les transitions (`sessionState`) restent privées au domaine. |
| `@cityborn/client/game` | `src/features/game/` | État d'affichage de la partie, flow de round, résultat de round, timer et compte à rebours, hook `useGameRound` et contrats de props (`MapProps`, `GameComponentProps`). |
| `@cityborn/client/play` | `src/features/play/` | Hook `usePlay` : formulaire de jonction, lancement solo / multi et garde d'authentification. |
| `@cityborn/client/health` | `src/features/health/` | Joignabilité du serveur (`useServerReachability`) : une `ApiResponseError` du healthcheck signifie « joignable », toute autre erreur « injoignable ». |
| `@cityborn/client/profile` | `src/features/profile/` | Projection des parties du profil, hooks `useProfile` et `useProfileEditor` (pseudo, mot de passe, suppression du compte). |
| `@cityborn/client/platform` | `src/platform/` | Ports plateforme (ci-dessous). |

Un nouveau domaine consommé par les apps se crée en ajoutant `src/features/<domaine>/index.ts` **et** son entrée dans l'`exports` map. Un type ou un helper vit dans son domaine ; `src/shared/` ne reçoit que ce qui sert à plusieurs domaines.

### État serveur

`@cityborn/client` porte seul l'état serveur, avec TanStack Query (`@tanstack/react-query`) : le `biome.json` de chaque app refuse les imports `@tanstack/*`. Dans un domaine qui accède à l'API :

- `api/<domaine>Api.ts` contient le port `XxxApi` et sa factory `createXxxApi`, seul fichier qui appelle `contractClient.<domaine>`.
- `api/<domaine>Queries.ts` contient les clés, les `queryOptions` et les mises à jour du cache. Chaque query fixe `staleTime` et `retry`, et déclare `meta.reportsError` (voir `client-error-handling`).
- Une donnée propre au compte connecté a une clé sous `accountQueryKey(userId)` (`auth/api/authQueries.ts`), que la déconnexion retire du cache.
- Un hook porte un seul comportement et lit ses données par les `queryOptions` du domaine : chaque appel crée tout l'état, les effets et les queries qu'il contient.
- Un fichier regroupe les hooks d'un même flux avec leurs formulaires et helpers privés, et porte le nom du flux (`auth/signIn.ts`, `session/sessionLauncher.ts`) ; un hook seul dans son flux vit dans `use<Comportement>.ts`.
- Une écriture reste un appel direct au port, et react-hook-form porte son état de soumission.

La logique de présentation suit les conventions React existantes : un hook headless porte le nom `use<Comportement>` (`useSoloSession`, `useGameRound`, `useProfile`) ; une transformation pure porte le nom précis de son résultat (`gameDisplay`, `gameResult`, `sessionState`). Les contrats de vue restent colocalisés dans leur domaine.

### Ports plateforme

Le package reste agnostique de Next, Expo, React Native et du rendu. Chaque besoin plateforme est un port typé dans `src/platform/`, implémenté dans le `lib/` de chaque app qui le consomme, puis injecté.

| Port | Implémenté avec |
|---|---|
| `TokenStorage` | `expo-secure-store` côté mobile. Le navigateur laisse Nest gérer les cookies `httpOnly`. |
| `KeyValueStorage` | `localStorage` côté web, `AsyncStorage` côté mobile. Stocke des chaînes : le domaine décode ce qu'il a écrit. |
| `AppFocus` | `AppState` de `react-native` côté mobile ; `ApiProvider` le branche sur le `focusManager` de TanStack. Le web n'en fournit pas et garde la détection de focus par défaut. |
| `Navigation` | `useRouter` de `next/navigation` ou d'`expo-router`. Ses chemins sont typés par `NavigationPath`, la liste des routes vers lesquelles `@cityborn/client` navigue. Un chemin ajouté doit exister dans les deux apps : la CI ne le vérifie pas (Next accepte toute chaîne, et les routes typées d'Expo ne sont générées qu'au lancement). |

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
