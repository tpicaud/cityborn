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

Pour tout ce qui touche à la gestion / l'affichage des erreurs de ces wrappers, voir le skill `client-error-handling`.

## Spécifique Next (App Router)

`src/app/` = routing uniquement : `layout.tsx`, `page.tsx`, `error.tsx`, `providers.tsx`, `api/`. Pas de logique de domaine ici — elle vit dans `features/`.
