# Observabilité backend — wide events

Une opération produit **un seul** récapitulatif structuré : requête HTTP, message WS, connexion, déconnexion. Le travail hors requête qui échoue émet un `operation_error` autonome.

## Quelle méthode appeler

| Situation | Appel |
|---|---|
| Auth résolue dans un guard | `enrichAuth` |
| Verdict du rate limiter | `enrichRateLimit` |
| Un identifiant métier devient connu | `enrichBusinessContext` |
| Erreur dans un service, un guard, un handler | laisser remonter au `DefaultExceptionFilter` |
| Filtre, ou callback WS `handleConnection` / `handleDisconnect` | `recordError` |
| Échec survenu hors de toute requête (Redis, lock, tâche de fond…) | `recordOperationError` |

`enrichBusinessContext` accepte les identifiants déclarés par `WideEventBusinessContext` — `gameId` ou `playerId` par exemple. Ce type porte la liste : un nouvel identifiant métier s'y ajoute, et devient enrichissable partout sans toucher au reste.

`recordError` enrichit l'event courant. Sans contexte actif ou après finalisation, il bascule sur un `operation_error` autonome plutôt que de perdre l'erreur. `recordOperationError` émet toujours un event autonome et exige un `WideEventOperationContext` (`domain`, `operation`).

## Invariants

- `run` ouvre le contexte CLS ; `finish` calcule `durationMs`, `outcome` et le niveau, puis émet. Le drapeau `finalized` rend `finish` idempotent.
- Un enrichissement après `finish` est ignoré en silence : enrichir tant que l'opération est en cours.
- `domain` et `outcome` sont bornés. Nouveau domaine → `WIDE_EVENT_DOMAINS`. Nouveau `kind` WS → `WsWideEventKind` **et** `wideEventLogShapes`.
- `operation` vaut `method + route` en HTTP, `eventName` en WS ; une route non résolue devient `<unmatched>`.
- `finish({ route })` recalcule `domain` et `operation` : la route n'est connue qu'après le routing.
- `autoLogging` reste à `false`, le wide event est la seule ligne par opération. Le `requestId` du CLS alimente `pino-http` par le `mixin`.

## Franchir une frontière async

`finish` appelé depuis un listener d'événement ou un opérateur rxjs s'exécute hors du contexte CLS et ne trouve plus l'event. Envelopper le callback dans `AsyncResource.bind` — modèle en place dans `HttpWideEventMiddleware` (`response.once('finish', …)`) et `WsWideEventLifecycle` (`finalize(…)`).

## Points d'entrée

| Transport | Ouverture | Fermeture |
|---|---|---|
| HTTP | `HttpWideEventMiddleware`, branché en tête de `configureApp()`, avant CORS, parsers, guards et routing | événement `finish` ou `close` de la réponse |
| Message WS | `WsWideEventLifecycle`, branché dans `RedisIoAdapter` autour du pipeline Nest complet | `finalize` ; `aborted` quand le flux n'a pas complété |
| Connexion WS | `runConnectionWideEvent` dans la gateway | `finish` dans un `finally`, après `enrichAuth` |

Pour instrumenter une nouvelle gateway, suivre `SessionGateway.runConnectionWideEvent` : ouvrir avec `createWsWideEvent`, enrichir l'auth depuis `socket.data.user`, finaliser dans un `finally`.
