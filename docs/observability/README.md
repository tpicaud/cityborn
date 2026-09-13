# Observabilité — drain Axiom

Le backend émet un wide event par requête HTTP, message WS, connexion et
déconnexion (voir la référence d'observabilité du skill `backend-conventions`).
Ces événements partent sur stdout — donc dans les logs Railway — et, quand la
configuration Axiom est présente, sont drainés en parallèle vers Axiom pour la
rétention longue et l'agrégation.

## Configuration

| Variable | Rôle |
|---|---|
| `AXIOM_TOKEN` | token d'API Axiom avec le droit d'ingestion sur le dataset |
| `AXIOM_DATASET` | dataset cible (`cityborn-backend-staging`, `cityborn-backend-prod`) |

Les deux variables sont requises : [`logger.params.ts`](../../apps/backend/src/common/logger/logger.params.ts)
n'ajoute la cible Axiom que si elles sont toutes les deux définies. En
développement local et dans les tests, aucune des deux n'est renseignée et le
comportement des logs reste inchangé.

L'ingestion est épinglée sur `https://api.eu.axiom.co` : les wide events
portent des données personnelles (`ip`, `userAgent`, `userId`), le compte et les
datasets doivent donc être provisionnés sur la région EU.

La `redact` de pino s'applique dans le thread principal, avant la sérialisation
vers les transports : les champs masqués ne quittent jamais le process en clair.

## Cibles de transport

- **stdout** — toujours active. En production, écriture directe sans transport
  tant qu'Axiom n'est pas configuré ; sinon cible `pino/file` sur le descripteur
  1. En dehors de la production, `pino-pretty`. Les logs Railway restent le
  filet en cas d'indisponibilité du drain.
- **Axiom** — cible additionnelle `@axiomhq/pino`. Le transport tourne dans un
  worker thread : une panne d'ingestion n'interrompt ni la requête ni stdout.

## Champs des wide events

Le contrat entre [`wide-event.ts`](../../apps/backend/src/common/wide-event/wide-event.ts)
et toute requête, où qu'elle vive. Renommer un champ ici oblige à reprendre les
requêtes sauvegardées, les dashboards et les monitors côté Axiom, qu'aucun
`grep` n'atteint.

Communs : `event` (`http_request` | `ws_message` | `ws_connection` |
`ws_disconnection`), `transport`, `requestId`, `domain`, `operation`,
`outcome`, `statusCode`, `durationMs`, `level`, `ip`, `userAgent`, `visitorId`,
`client`, `clientVersion`.

HTTP : `method`, `route`, `apiVersion`.
WS : `kind`, `eventName`, `socketId`.
Auth : `isAuthenticated`, `userId`.
Métier : `sessionId`, `playerId`, `gameId`.
Erreur : `errorCode`, `errorMessage`, `errorStack`, `errorCauses`.
Rate limit : `rateLimitBucket`, `rateLimitStatus`, `rateLimitRemaining`.

## Requêtes et alertes

Elles vivent dans Axiom — requêtes sauvegardées, dashboards et monitors. Le
repo ne garde pas de copie du texte APL : Axiom en est propriétaire, une copie
ici dériverait sans que rien ne le signale.
