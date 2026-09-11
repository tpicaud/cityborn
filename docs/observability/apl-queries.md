# Requêtes APL de référence

Remplacer `['cityborn-backend-prod']` par le dataset de l'environnement visé.

## Champs disponibles

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

## Santé générale

Répartition des `outcome` par domaine sur la fenêtre sélectionnée.

```kusto
['cityborn-backend-prod']
| where isnotnull(outcome)
| summarize count() by domain, outcome
| sort by domain asc, count_ desc
```

Taux d'erreur serveur dans le temps.

```kusto
['cityborn-backend-prod']
| where isnotnull(outcome)
| summarize
    total = count(),
    serverErrors = countif(outcome == "server_error")
    by bin_auto(_time)
| extend errorRate = todouble(serverErrors) / todouble(total)
| project _time, total, serverErrors, errorRate
```

## Latence

Percentiles par opération, opérations les plus lentes en tête.

```kusto
['cityborn-backend-prod']
| where isnotnull(durationMs)
| summarize
    calls = count(),
    p50 = percentile(durationMs, 50),
    p95 = percentile(durationMs, 95),
    p99 = percentile(durationMs, 99)
    by domain, operation
| where calls > 10
| sort by p95 desc
```

Dérive de latence d'une opération dans le temps.

```kusto
['cityborn-backend-prod']
| where operation == "GET /v1/session/:id"
| summarize p95 = percentile(durationMs, 95) by bin_auto(_time)
```

## Erreurs

Top des `errorCode` métier.

```kusto
['cityborn-backend-prod']
| where isnotnull(errorCode)
| summarize count() by errorCode, domain, operation
| sort by count_ desc
```

Détail des erreurs serveur, avec la chaîne de causes.

```kusto
['cityborn-backend-prod']
| where outcome == "server_error"
| project _time, requestId, operation, statusCode, errorCode, errorMessage, errorCauses, userId
| sort by _time desc
```

Requêtes abandonnées par le client.

```kusto
['cityborn-backend-prod']
| where outcome == "aborted"
| summarize count(), p95 = percentile(durationMs, 95) by operation
| sort by count_ desc
```

## Investigation ciblée

Toutes les lignes d'une requête, wide event et logs applicatifs compris.

```kusto
['cityborn-backend-prod']
| where requestId == "<requestId>"
| project _time, level, event, operation, statusCode, durationMs, msg
| sort by _time asc
```

Parcours d'un utilisateur.

```kusto
['cityborn-backend-prod']
| where userId == "<userId>"
| project _time, transport, operation, outcome, statusCode, durationMs, errorCode
| sort by _time desc
```

Activité sur une partie.

```kusto
['cityborn-backend-prod']
| where gameId == "<gameId>"
| project _time, transport, operation, playerId, outcome, durationMs, errorCode
| sort by _time asc
```

## WebSocket

Volume et latence par événement WS.

```kusto
['cityborn-backend-prod']
| where transport == "ws"
| summarize count(), p95 = percentile(durationMs, 95) by kind, eventName, outcome
| sort by count_ desc
```

Connexions et déconnexions dans le temps.

```kusto
['cityborn-backend-prod']
| where event in ("ws_connection", "ws_disconnection")
| summarize count() by event, bin_auto(_time)
```

## Rate limiting

Rejets par bucket et par opération.

```kusto
['cityborn-backend-prod']
| where rateLimitStatus == "rejected"
| summarize count() by rateLimitBucket, operation, domain
| sort by count_ desc
```

Pannes du rate limiter, à surveiller : elles remontent en 500.

```kusto
['cityborn-backend-prod']
| where rateLimitStatus == "failed"
| summarize count() by bin_auto(_time), rateLimitBucket
```

## Clients et versions d'API

Adoption des versions du contrat et des builds clients.

```kusto
['cityborn-backend-prod']
| where transport == "http"
| summarize count() by apiVersion, client, clientVersion
| sort by count_ desc
```

Routes non reconnues par le routeur : 404 réels ou instrumentation à corriger.

```kusto
['cityborn-backend-prod']
| where route == "<unmatched>"
| summarize count() by method, statusCode
| sort by count_ desc
```
