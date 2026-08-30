---
name: client-app-architecture
description: Structure et conventions d'une app cliente Cityborn (apps/frontend, apps/back-office, apps/mobile) — organisation par domaine (features/, components/ui/, lib/, contexts/, hooks/), accès à l'API (server actions use-server/ vs loaders server-only/ côté Next, lib/api/ côté mobile), routing App Router. À utiliser dès qu'on crée ou modifie un composant, un hook, une feature ou un accès API dans une de ces trois apps.
---

# Structure d'une app cliente (front & mobile)

Front (`apps/frontend`, `apps/back-office`) et mobile (`apps/mobile`) suivent la **même** organisation par domaine — garder les deux cohérents lorsqu'on touche un domaine partagé.

## Organisation par domaine

| Dossier | Contenu |
|---|---|
| `features/<domaine>/` | Un dossier par domaine fonctionnel : composant d'entrée + `components/` + `hooks/` locaux. C'est ici que va le gros du code. |
| `components/ui/` | Composants UI génériques réutilisables, propres à l'app (hors `@cityborn/design-system`). |
| `lib/` | Intégrations transverses bas niveau : socket, storage du token, visitorId, client API. |
| `contexts/`, `hooks/` | React transverse à plusieurs domaines. |

Avant de créer un fichier : préférer étendre un fichier existant du bon dossier. Créer seulement si c'est évident vu la structure ; sinon demander où placer le code.

## Accès à l'API

- **Mobile** → `lib/api/`.
- **Next** → `src/server/` :
  - `server/use-server/` — server actions (`'use server'`), wrappées par `toApiResult` → renvoient un `ApiResult<T>`.
  - `server/server-only/` — loaders de Server Components (`server-only`), wrappés par `unwrapApiResponse` → renvoient le body typé ou `throw`.

Pour tout ce qui touche à la gestion / l'affichage des erreurs de ces wrappers, voir le skill `client-error-handling`.

## Spécifique Next (App Router)

`src/app/` = routing uniquement : `layout.tsx`, `page.tsx`, `error.tsx`, `providers.tsx`, `api/`. Pas de logique de domaine ici — elle vit dans `features/`.

## Placement du code partagé

Rappel des frontières (détail dans `AGENTS.md`) :

- partagé front + mobile uniquement, ne transite pas par l'API → `@cityborn/client`
- transite par l'API → `@cityborn/api`
- partagé backend + front/mobile → `@cityborn/core`
