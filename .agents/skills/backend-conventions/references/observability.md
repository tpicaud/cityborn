# Observabilité backend — wide events

Une opération produit **un seul** récapitulatif structuré : requête HTTP, message WS, connexion, déconnexion. Le travail hors requête qui échoue émet un `operation_error` autonome.

## Quelle méthode appeler

| Situation | Appel |
|---|---|
| Auth résolue dans un guard | `enrichAuth` |
| Verdict du rate limiter | `enrichRateLimit` |
| Un identifiant métier devient connu | `enrichBusinessContext` |
| Erreur dans un service, un guard, un handler | laisser remonter au `DefaultExceptionFilter` |
| Filtre, `WsHandshakeMiddleware` ou callback WS `handleDisconnect` | `recordError` |
| Échec survenu hors de toute requête (Redis, lock, tâche de fond…) | `recordOperationError` |

`enrichBusinessContext` accepte les identifiants déclarés par `WideEventBusinessContext` — `gameId` ou `playerId` par exemple. Ce type porte la liste : un nouvel identifiant métier s'y ajoute, et devient enrichissable partout sans toucher au reste.

`recordError` enrichit l'event courant. Sans contexte actif ou après finalisation, il bascule sur un `operation_error` autonome plutôt que de perdre l'erreur. `recordOperationError` émet toujours un event autonome et exige un `WideEventOperationContext` (`domain`, `operation`).

## Invariants

- `run` ouvre le contexte CLS ; `finish` calcule `durationMs`, `outcome` et le niveau, puis émet. Le drapeau `finalized` rend `finish` idempotent.
- Le CLS porte un unique objet d'état (`wideEventState`) muté en place, jamais remplacé via `cls.set` : les contextes imbriqués (`ClsMiddleware` de `PrismaClsModule`, `@Transactional`) héritent d'une copie superficielle du store, seul un objet partagé par référence remonte leurs enrichissements jusqu'à `finish`.
- Un enrichissement après `finish` est ignoré en silence : enrichir tant que l'opération est en cours.
- `domain` et `outcome` sont bornés. `WideEventDomain` dérive d'`ApiDomain` : nouveau domaine → `API_DOMAINS` dans `@cityborn/api`, `infrastructure` et `other` restent propres au backend. Nouveau `kind` WS → `WsWideEventKind` **et** `wideEventLogShapes`.
- `operation` vaut `method + route` en HTTP, `eventName` en WS ; une route non résolue devient `<unmatched>`. `action` dérive du contrat et reste absente pour une route hors contrat.
- `finish({ route })` recalcule `domain`, `operation` et `action` : la route n'est connue qu'après le routing.
- `autoLogging` reste à `false`, le wide event est la seule ligne par opération. Le `requestId` du CLS alimente `pino-http` par le `mixin`.

## Franchir une frontière async

`finish` appelé depuis un listener d'événement ou un opérateur rxjs s'exécute hors du contexte CLS et ne trouve plus l'event. Envelopper le callback dans `AsyncResource.bind` — modèle en place dans `HttpWideEventMiddleware` (`response.once('finish', …)`) et `WsWideEventLifecycle` (`finalize(…)`).

## Points d'entrée

| Transport | Ouverture | Fermeture |
|---|---|---|
| HTTP | `HttpWideEventMiddleware`, branché en tête de `configureApp()`, avant CORS, parsers, guards et routing | événement `finish` ou `close` de la réponse |
| Message WS | `WsWideEventLifecycle`, branché dans `RedisIoAdapter` autour du pipeline Nest complet | `finalize` ; `aborted` quand le flux n'a pas complété |
| Connexion WS | `WsHandshakeMiddleware`, branché par `RedisIoAdapter` via `server.use()`, autour du rate-limit, du visitorId et de l'auth ; un handshake refusé reste couvert. Event de transport `connect`, domaine `infrastructure`, sans `action` | `finish` dans un `finally`, après `enrichAuth` |
| Déconnexion WS | `handleDisconnect` de la gateway, event `<domaine>:disconnect` du channel | idem |

Le handshake est transverse à toutes les gateways et ignore les channels : il n'importe rien d'un domaine métier. Une nouvelle gateway ne gère ni rate-limit, ni auth, ni visitorId de connexion, et lit `socket.data` (`AppSocketData`) tel quel. Pour instrumenter sa déconnexion, appeler `WsWideEventLifecycle.runDisconnection` avec l'event `<domaine>:disconnect` de son channel ; il ouvre avec `createWsWideEvent`, enrichit l'auth depuis `socket.data.user` et finalise dans un `finally`.
