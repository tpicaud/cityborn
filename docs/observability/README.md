# Observabilité — drain Axiom

Un wide event par requête HTTP, message WS, connexion et déconnexion, toujours sur stdout — donc dans Railway, qui reste le filet — et vers Axiom quand il est configuré. Construction des events : [référence d'observabilité](../../.agents/skills/backend-conventions/references/observability.md).

## Configuration

| Variable | Valeur |
|---|---|
| `AXIOM_TOKEN` | token d'API, permission `ingest`, restreint au dataset |
| `AXIOM_DATASET` | `cityborn-backend-staging`, `-prod`, `-dev` |

Sans les deux, [`logger.params.ts`](../../apps/backend/src/common/logger/logger.params.ts) n'ajoute pas la cible Axiom et rien d'autre ne change. En local elles vont dans `apps/backend/.env` : `main.ts` précharge `dotenv/config` avant `AppModule`, sans quoi `logger.params` lirait l'environnement trop tôt.

## Provisionnement

- S'inscrire sur **`app.eu.axiom.co`**, pas `app.axiom.co` : pas de migration entre régions, et les events portent `ip`, `userAgent`, `userId`.
- Un dataset et un token par environnement.
- Ingestion sur `eu-central-1.aws.edge.axiom.co` via l'option `edge` ([doc Axiom](https://axiom.co/docs/guides/pino)) ; `url` ne sert qu'aux opérations hors ingestion, que le transport ne fait jamais.

## Cibles

| `NODE_ENV` | Axiom | stdout | drain |
|---|---|---|---|
| `production` | non | écriture directe, sans worker | — |
| `production` | oui | `pino/file` sur le fd 1 | `@axiomhq/pino` |
| autre | non | `pino-pretty` | — |
| autre | oui | `pino-pretty` | `@axiomhq/pino` |

Le drain tourne dans un worker : une panne d'ingestion n'interrompt ni la requête ni stdout. La `redact` s'applique dans le thread principal, avant tout envoi.

## Champs

Contrat entre [`wide-event.ts`](../../apps/backend/src/common/wide-event/wide-event.ts) et les requêtes Axiom, qu'aucun `grep` n'atteint : renommer ici oblige à reprendre dashboards et monitors.

- **Communs** — `event` (`http_request` | `ws_message` | `ws_connection` | `ws_disconnection` | `operation_error`), `transport`, `requestId`, `domain`, `operation`, `outcome`, `statusCode`, `durationMs`, `ip`, `userAgent`, `visitorId`, `client`, `clientVersion`
- **HTTP** — `method`, `route`, `apiVersion`
- **WS** — `kind`, `eventName`, `socketId`
- **Auth** — `isAuthenticated`, `userId`
- **Métier** — `sessionId`, `playerId`, `gameId`
- **Erreur** — `errorCode`, `errorMessage`, `errorStack`, `errorCauses`
- **Rate limit** — `rateLimitBucket`, `rateLimitStatus`, `rateLimitRemaining`
- **Pino** — `_time` (horodatage natif Axiom, issu de `time`), `level`, `msg`, `pid`, `hostname`

`domain` vient de `API_DOMAINS` (`@cityborn/api`), le vocabulaire qui contraint les `pathPrefix` des contrats ts-rest : une route ou un event WS y est rattaché par son premier segment, `infrastructure` couvre le hors-contrat écrit à la main et `other` le reste. Ajouter un domaine passe donc par `API_DOMAINS`, jamais par le backend seul.

Une ligne sous `LOG_LEVEL` (défaut `info`) n'atteint aucune cible ; les wide events sont toujours `info`, `warn` ou `error`.

## Requêtes et alertes

Dans Axiom — requêtes sauvegardées, dashboards, monitors. Pas de copie du texte APL ici : elle dériverait en silence.
