# Observabilité backend

Chaque requête HTTP, message WS, connexion ou déconnexion produit un seul récapitulatif structuré.

- Les événements sont `http_request`, `ws_message`, `ws_connection` et `ws_disconnection`. Côté WS, `kind` (`message | connection | disconnection`) discrimine leur forme ; un nouveau `kind` s'ajoute à `WsWideEventKind` et `wideEventLogShapes`. `WideEventService.run` ouvre le contexte CLS ; `finish` calcule durée, résultat et niveau, puis finalise l'événement.
- `HttpWideEventMiddleware` est branché au début de `configureApp()`, avant CORS, parsers, guards et routing. Il termine sur `finish` ou `close`. `WsWideEventLifecycle`, branché dans `RedisIoAdapter`, ouvre le contexte à la souscription, exécute le pipeline Nest complet, puis termine à la complétion ou à l'annulation. L'émission reste dans ces composants ; le lifecycle ne construit pas de réponse métier.
- Les callbacks `handleConnection` et `handleDisconnect` ouvrent leur propre contexte via `runConnectionWideEvent` (`session:connect` / `session:disconnect`), enrichissent l'auth depuis `socket.data.user` et appellent `finish` dans un `finally`. Une gateway instrumentée suit ce modèle et enregistre la connexion dans l'événement structuré.
- Dans les services et guards, utiliser `enrichAuth`, `enrichRateLimit` ou `enrichBusinessContext`. Le filtre enregistre les erreurs de requête ou de message ; le lifecycle WS les laisse remonter.
- `recordError` appartient au filtre et aux callbacks de connexion/déconnexion WS. Sous un contexte actif, il enrichit l'événement en cours. Sans contexte actif ou après finalisation, il émet un diagnostic structuré autonome. Les événements d'infrastructure peuvent avoir leurs propres logs.
- `domain` et `outcome` sont bornés. Déclarer les nouveaux domaines dans `WIDE_EVENT_DOMAINS`. L'opération est `method + route` pour HTTP et `eventName` pour WS ; une route non reconnue devient `<unmatched>`.
- `WideEventService` utilise le `PinoLogger` existant. Le `requestId` CLS est partagé avec `pino-http` et les autres logs Pino ; `autoLogging` reste à `false`.
