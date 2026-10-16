---
name: client-error-handling
description: Erreurs et validation client Cityborn. À utiliser pour modifier un wrapper d'API, l'affichage d'une erreur ou un formulaire dans les apps front, mobile et back-office.
---

# Gestion des erreurs — apps clientes

| Contexte | Helper | Résultat |
|---|---|---|
| Factory de domaine `@cityborn/client` (`api/<domaine>Api.ts`) | `unwrapApiResponse(result)` | body typé, ou `throw` un `ApiResponseError` ; l'action du hook l'attrape (`try/catch`) et le passe à `reportError` |
| Query `@cityborn/client` (`api/<domaine>Queries.ts`) | `meta: { reportsError }` dans ses `queryOptions` | le `queryFn` appelle le port sans `try/catch` ; `true` : la `QueryCache` créée par `ApiProvider` passe l'erreur finale, après les `retry`, à `reportError` si un composant observe encore la query et qu'elle n'a pas encore de données ; `false` : le hook expose l'erreur à la vue |
| Afficher une erreur | `useErrorReporter()` → `reportError(error)` | dialog ; accepte `unknown`, normalise via `resolveErrorMessage` (ne pas pré-convertir) ; repli : `reportError(error, 'message par défaut')` |

## Règles

- **Providers** : `useErrorReporter` lève une erreur hors d'`ErrorReporterProvider`, et `ApiProvider` se monte sous `ErrorReporterProvider` pour lui transmettre les erreurs de query.
- **Ne jamais `throw` un objet nu** : `throw new ApiResponseError(apiError)` (vraie `Error` : stack, `instanceof`).
- **Messages FR** : l'utilisateur ne voit que le message d'un `ErrorCode` (`resolveErrorMessage` / `getFriendlyErrorMessage`), celui d'une `UserFacingError` (`@cityborn/api`) ou le repli passé à `reportError`, sinon le message générique. Un message technique (`Error.message`, message renvoyé par le serveur) reste dans la console.
- **Map zod FR** : `installFrenchZodErrorMap()` (de `@cityborn/api`) installe les messages de validation zod en français. Appelé une fois au bootstrap de chaque app — `apps/backend/src/main.ts`, `apps/frontend/src/app/providers.tsx`, `apps/back-office/app/providers.tsx`, `apps/mobile/app/_layout.tsx`. Pas d'effet de bord à l'import : l'appel doit rester explicite.
- **Validation de formulaire** : `zodResolver` + schéma partagé (`@cityborn/api` ou `@cityborn/client`). On ne route pas les `fieldErrors` d'un 400 vers les champs (le client valide avec le même schéma) → l'erreur rejoint `reportError` telle quelle.

## Critère de fin

- Chaque appel utilise le wrapper de son contexte.
- L'`ApiError` reste intacte jusqu'à sa normalisation.
- Les messages métier proviennent d'`ErrorCode`.
- Chaque formulaire utilise le schéma partagé.
- Chaque erreur de formulaire rejoint le mécanisme commun sans conversion intermédiaire.
