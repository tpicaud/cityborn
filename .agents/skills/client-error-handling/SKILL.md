---
name: client-error-handling
description: Gestion des erreurs côté front & mobile Cityborn — toApiResult / ApiResult, unwrapApiResponse / ApiResponseError, useError() + invokeError, messages FR via ErrorCode de @cityborn/api, installFrenchZodErrorMap, validation de formulaire (zodResolver + schéma partagé). À utiliser quand on affiche ou propage une erreur, qu'on écrit un wrapper d'API (use-server/, apps/mobile/lib/api/) ou un loader de Server Component (server-only/), ou qu'on branche un formulaire.
---

# Gestion des erreurs — front & mobile

| Contexte | Helper | Résultat |
|---|---|---|
| Wrapper d'API (`use-server/`, `apps/mobile/lib/api/`) | `toApiResult(result)` | `ApiResult<T>` = `{ ok: true, data } \| { ok: false, error: ApiError }` — brancher sur `result.ok` |
| Loader de Server Component (`server-only/`) | `unwrapApiResponse(result)` | body typé, ou `throw` un `ApiResponseError` capté par `error.tsx` |
| Afficher une erreur | `useError()` → `invokeError(error)` | dialog ; accepte `unknown`, normalise via `resolveErrorMessage` (ne pas pré-convertir) ; repli : `invokeError(error, 'message par défaut')` |

## Règles

- **Ne jamais `throw` un objet nu** : `throw new ApiResponseError(apiError)` (vraie `Error` : stack, `instanceof`).
- **Messages FR** : seule source = `ErrorCode` dans `@cityborn/api` (`resolveErrorMessage` / `getFriendlyErrorMessage`). Ne pas écrire de message en dur.
- **Map zod FR** : `installFrenchZodErrorMap()` (de `@cityborn/api`) installe les messages de validation zod en français. Appelé une fois au bootstrap de chaque app — `apps/backend/src/main.ts`, `apps/frontend/src/app/providers.tsx`, `apps/back-office/app/providers.tsx`, `apps/mobile/app/_layout.tsx`. Pas d'effet de bord à l'import : l'appel doit rester explicite.
- **Validation de formulaire** : `zodResolver` + schéma partagé (`@cityborn/api` ou `@cityborn/client`). On ne route pas les `fieldErrors` d'un 400 vers les champs (le client valide avec le même schéma) → `!result.ok` → `invokeError(result.error)`.
