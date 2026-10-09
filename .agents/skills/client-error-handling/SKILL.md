---
name: client-error-handling
description: Erreurs et validation client Cityborn. À utiliser pour modifier un wrapper d'API, l'affichage d'une erreur ou un formulaire dans les apps front et mobile.
---

# Gestion des erreurs — front & mobile

| Contexte | Helper | Résultat |
|---|---|---|
| Factory de domaine `@cityborn/client`, `apps/mobile/lib/api/`, `apps/back-office/lib/api/` | `unwrapApiResponse(result)` | body typé, ou `throw` un `ApiResponseError` ; l'action du hook l'attrape (`try/catch`) et le passe à `invokeError` |
| Query `@cityborn/client` (`api/<domaine>Queries.ts`) | `meta: { reportsError }` dans ses `queryOptions` | le `queryFn` appelle le port sans `try/catch` ; `true` : la `QueryCache` créée par `ApiProvider` passe l'erreur finale, après les `retry`, à `invokeError` si un composant observe encore la query et qu'elle n'a pas encore de données ; `false` : le hook expose l'erreur à la vue |
| Afficher une erreur | `useError()` → `invokeError(error)` | dialog ; accepte `unknown`, normalise via `resolveErrorMessage` (ne pas pré-convertir) ; repli : `invokeError(error, 'message par défaut')` |

## Règles

- **Providers** : `useError` lève une erreur hors d'`ErrorProvider`, et `ApiProvider` se monte sous `ErrorProvider` pour lui transmettre les erreurs de query.
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
