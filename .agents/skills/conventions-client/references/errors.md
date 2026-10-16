# Erreurs et formulaires

| Contexte | Mécanisme |
|---|---|
| Port de domaine | `unwrapApiResponse(result)` renvoie le body typé ou lève une `ApiResponseError`. |
| Action d'un hook | Attrape l'erreur et la passe à `reportError`. |
| Query | Le `queryFn` appelle le port sans `try/catch`. `meta.reportsError: true` signale l'erreur finale, après les `retry` ; `false` laisse le hook exposer l'erreur à la vue. |
| Affichage | `useErrorReporter().reportError(error, repli?)` accepte `unknown` : l'erreur lui parvient telle quelle. |

- Une erreur levée est une `Error`, jamais un objet nu.
- L'utilisateur ne voit que le message d'un `ErrorCode`, celui d'une `UserFacingError` ou le repli passé à `reportError` ; un message technique n'est jamais affiché.
- Un message propre au client passe par `new UserFacingError(message)`.
- Un formulaire valide avec `zodResolver` et le schéma partagé. Une erreur 400 rejoint `reportError` telle quelle, sans être routée vers les champs.

## Critère de fin

- Chaque appel passe par le mécanisme de son contexte.
- Chaque message affiché vient d'un `ErrorCode`, d'une `UserFacingError` ou d'un repli.
