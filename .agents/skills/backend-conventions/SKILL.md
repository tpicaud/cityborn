---
name: backend-conventions
description: Conventions d'architecture backend NestJS Cityborn (apps/backend) — structure des modules, gestion des erreurs et observabilité. À utiliser dès qu'on crée ou modifie du code NestJS dans apps/backend, notamment un module, controller, service, mapper, guard ou gateway.
---

# Conventions backend (NestJS)

## Structure d'un module

- `feature/feature.module.ts` + `controllers/` + `services/` + `mappers/` (entité DB → DTO du contrat).
- Controllers = handlers ts-rest (`@TsRestHandler(contract.x)` + `tsRestHandler`), **fins** : aucune logique métier, tout dans les services.
- Séparer `*.public.*` / `*.admin.*` (controller + service) quand l'auth ou les règles diffèrent.

## Gestion des erreurs

- Lever une exception Nest **typée** depuis les services : `throw new NotFoundException({ code: ErrorCode.X, message })` (idem `ConflictException`, `BadRequestException`, `UnauthorizedException`). `code` = un `ErrorCode` de `@cityborn/api`, jamais une string libre.
- **Ne jamais construire la réponse d'erreur HTTP/WS dans un service** : `DefaultExceptionFilter`, injectable et global via `APP_FILTER` pour HTTP, sérialise les exceptions en `ApiError`. Les gateways l'appliquent avec `@UseFilters(DefaultExceptionFilter)` ; le filtre répond par acknowledgement WS, ou par événement `error` si aucun acknowledgement n'est fourni.
- `normalizeException` centralise la conversion Nest / WS / Prisma / validation ts-rest / corps trop volumineux. Les erreurs Prisma (`P2002`, `P2025`, …) y sont déjà mappées pour les deux transports — ne pas les `catch` pour les relancer.
- **Aucun `catch` d'erreur dans les services, guards ou handlers de messages** : laisser les erreurs remonter au filtre, sans les absorber, les envelopper ou les logger localement. Seuls les callbacks de connexion/déconnexion WS, hors pipeline des filtres Nest, peuvent les intercepter. Un `try/finally` reste autorisé pour libérer une ressource.
- Les messages 5xx publics restent génériques ; le diagnostic interne conserve l'exception originale et sa chaîne de causes bornée. Les erreurs JWT et les rejets `RateLimiterRes` sont classifiés centralement en 401 et 429 ; une panne du rate limiter remonte en 500.
- `installFrenchZodErrorMap()` est déjà appelé au bootstrap (configuration partagée `apps/backend/src/configure-app.ts`).

## Observabilité — un récapitulatif par opération

- **Une seule ligne récapitulative par opération** : requête HTTP (`event: 'http_request'`), message WS traité (`event: 'ws_message'`), connexion WS (`event: 'ws_connection'`) et déconnexion WS (`event: 'ws_disconnection'`). Côté WS, `kind` (`'message' | 'connection' | 'disconnection'`) discrimine la forme de la ligne ; un nouveau `kind` s'ajoute à `WsWideEventKind` et à `wideEventLogShapes`. `WideEventService.run` ouvre le contexte CLS ; `finish` calcule durée, résultat et niveau, puis émet une seule fois. Les enrichissements ne modifient plus un événement finalisé.
- `HttpWideEventMiddleware` est branché au début de `configureApp()`, avant CORS, parsers, guards et routing. Il termine sur `finish` ou `close`. `WsWideEventLifecycle`, branché dans `RedisIoAdapter`, ouvre le contexte **à la souscription** et y exécute le pipeline Nest complet ; il termine à la complétion ou à l'annulation. Ne pas déplacer l'émission dans un interceptor ni construire une réponse métier dans le lifecycle.
- Les callbacks `handleConnection` / `handleDisconnect` de la gateway ouvrent leur propre contexte via `runConnectionWideEvent` (`session:connect` / `session:disconnect`), qui enrichit l'auth depuis `socket.data.user` et appelle `finish` dans un `finally`. Une gateway qui instrumente ses callbacks suit ce modèle ; elle ne logue pas la connexion en texte libre.
- Dans les services et guards, utiliser uniquement `enrichAuth`, `enrichRateLimit` ou `enrichBusinessContext` pour le contexte normal. Le filtre est le seul responsable de l’enregistrement des erreurs de requête/message ; le lifecycle WS ne les intercepte pas.
- `recordError` est réservé au filtre et aux callbacks de connexion/déconnexion WS. Il normalise, enregistre et retourne l'`ApiError`. Sous un contexte actif il enrichit l'événement en cours — c'est le cas des callbacks WS depuis leur instrumentation. Sans contexte actif, ou après finalisation, il émet un diagnostic structuré autonome. Les erreurs tardives restent ainsi visibles sans réémettre le récapitulatif. Les événements d'infrastructure (Redis, démarrage) peuvent avoir leurs propres logs.
- `domain` et `outcome` sont bornés. Déclarer les nouveaux domaines dans `WIDE_EVENT_DOMAINS`. L'opération est `method + route` pour HTTP, `eventName` pour WS ; une route non reconnue devient `<unmatched>`, sans URL libre dans cette dimension.
- `WideEventService` utilise le `PinoLogger` existant. Le `requestId` CLS est aussi utilisé par `pino-http` et les autres logs Pino ; `autoLogging` reste à `false`. Aucun logger Pino séparé pour les wide events.

## Garde-fou DB

Migrations Prisma : voir *Garde-fous* dans `AGENTS.md`.
