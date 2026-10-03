---
name: client-error-handling
description: Erreurs et validation client Cityborn. À utiliser pour modifier un wrapper d'API, un loader de Server Component du back-office, l'affichage d'une erreur ou un formulaire dans les apps front et mobile.
---

# Gestion des erreurs — front & mobile

| Contexte | Helper | Résultat |
|---|---|---|
| Factory de domaine `@cityborn/client`, `apps/mobile/lib/api/` | `unwrapApiResponse(result)` | body typé, ou `throw` un `ApiResponseError` ; le hook l'attrape (`try/catch`) et le passe à `invokeError` |
| Server action du back-office (`server/use-server/`) | `toApiResult(result)` | `ApiResult<T>` = `{ ok: true, data } \| { ok: false, error: ApiError }`, sérialisable entre serveur et client — brancher sur `result.ok` |
| Loader de Server Component du back-office (`server-only/`) | `unwrapApiResponse(result)` | body typé, ou `throw` un `ApiResponseError` capté par `error.tsx` |
| Afficher une erreur | `useError()` → `invokeError(error)` | dialog ; accepte `unknown`, normalise via `resolveErrorMessage` (ne pas pré-convertir) ; repli : `invokeError(error, 'message par défaut')` |

## Règles

- **Ne jamais `throw` un objet nu** : `throw new ApiResponseError(apiError)` (vraie `Error` : stack, `instanceof`).
- **Messages FR** : seule source = `ErrorCode` dans `@cityborn/api` (`resolveErrorMessage` / `getFriendlyErrorMessage`). Ne pas écrire de message en dur.
- **Map zod FR** : `installFrenchZodErrorMap()` (de `@cityborn/api`) installe les messages de validation zod en français. Appelé une fois au bootstrap de chaque app — `apps/backend/src/main.ts`, `apps/frontend/src/app/providers.tsx`, `apps/back-office/app/providers.tsx`, `apps/mobile/app/_layout.tsx`. Pas d'effet de bord à l'import : l'appel doit rester explicite.
- **Validation de formulaire** : `zodResolver` + schéma partagé (`@cityborn/api` ou `@cityborn/client`). On ne route pas les `fieldErrors` d'un 400 vers les champs (le client valide avec le même schéma) → l'erreur rejoint `invokeError` telle quelle.

## Critère de fin

- Chaque appel utilise le wrapper de son contexte.
- L'`ApiError` reste intacte jusqu'à sa normalisation.
- Les messages métier proviennent d'`ErrorCode`.
- Chaque formulaire utilise le schéma partagé.
- Chaque erreur de formulaire rejoint le mécanisme commun sans conversion intermédiaire.
