# Observabilité — drain Axiom

Un wide event par requête HTTP, message WS, connexion et déconnexion, toujours sur stdout — donc dans Railway, qui reste le filet — et vers Axiom quand il est configuré. Construction des events : [référence d'observabilité](../../.agents/skills/conventions-backend/references/observability.md).

## Configuration

| Variable | Valeur |
|---|---|
| `AXIOM_TOKEN` | token d'API, permission `ingest`, restreint au dataset |
| `AXIOM_DATASET` | `cityborn-backend-dev`, `-staging`, `-production` |

Sans les deux, [`logger.params.ts`](../../apps/backend/src/common/logger/logger.params.ts) n'ajoute pas la cible Axiom et rien d'autre ne change. En local elles vont dans `apps/backend/.env` : `main.ts` précharge `dotenv/config` avant `AppModule`, sans quoi `logger.params` lirait l'environnement trop tôt.

## Provisionnement

- S'inscrire sur **`app.eu.axiom.co`**, pas `app.axiom.co` : pas de migration entre régions, et les events portent `ip`, `userAgent`, `userId`.
- Un dataset et un token par environnement.
- Un token d'API avancé limité aux dashboards de l'organisation, pour la CI : secret GitHub `AXIOM_DASHBOARDS_TOKEN`.
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

Contrat entre [`wide-event.ts`](../../apps/backend/src/common/wide-event/wide-event.ts) et les requêtes Axiom : renommer, supprimer ou changer le sens d'un champ ou d'une de ses valeurs oblige à reprendre, dans la même PR, les dashboards de [`infra/axiom/dashboards/`](../../infra/axiom/dashboards/) et, hors de portée de `grep`, les requêtes sauvegardées et les monitors.

- **Communs** — `event` (`http_request` | `ws_message` | `ws_connection` | `ws_disconnection` | `operation_error`), `transport`, `requestId`, `domain`, `action` (opérations du contrat), `operation`, `outcome`, `statusCode`, `durationMs`, `ip`, `userAgent`, `visitorId`, `client`, `clientVersion`
- **HTTP** — `method`, `route`, `apiVersion`
- **WS** — `kind`, `eventName`, `socketId`
- **Auth** — `isAuthenticated`, `userId`
- **Métier** — `sessionId`, `playerId`, `gameId`
- **Erreur** — `errorCode`, `errorMessage`, `errorStack`, `errorCauses`
- **Rate limit** — `rateLimitBucket`, `rateLimitStatus`, `rateLimitRemaining`
- **Pino** — `_time` (horodatage natif Axiom, issu de `time`), `level`, `msg`, `pid`, `hostname`

`domain` vient de `API_DOMAINS` (`@cityborn/api`), le vocabulaire qui contraint les `pathPrefix` des contrats ts-rest : une route ou un event WS y est rattaché par son premier segment, `infrastructure` couvre le hors-contrat écrit à la main et `other` le reste. Ajouter un domaine passe donc par `API_DOMAINS`, jamais par le backend seul.

`action` identifie l'opération demandée, dérivée de la clé de route ts-rest ou d'event `clientToServer` : `session.createSession`, `session.guess`, `admin.pack.getPackTrees`. Les connexions et déconnexions WS portent `session.connect` et `session.disconnect`, dérivés du domaine du channel. Une route hors contrat ou non reconnue n'a pas d'`action` ; `route` distingue alors `/` de `<unmatched>`. `operation` conserve sa valeur technique actuelle pour les requêtes Axiom existantes et les opérations hors contrat ; utiliser `action` pour regrouper les opérations du contrat.

Une ligne sous `LOG_LEVEL` (défaut `info`) n'atteint aucune cible ; les wide events sont toujours `info`, `warn` ou `error`.

## Dashboards

Source de vérité : [`infra/axiom/dashboards/`](../../infra/axiom/dashboards/), un fichier par dashboard, commun à tous les environnements.

- Le fichier est le document Axiom du dashboard ([format](https://axiom.co/docs/restapi/endpoints/createDashboard)), sans `uid`. `{{environment}}` y vaut `dev`, `staging` ou `production`, et chaque requête lit `['cityborn-backend-{{environment}}']`.
- Le déploiement crée ou remplace le dashboard `cityborn-<environnement>-<fichier>` et supprime ceux de l'environnement dont le fichier a disparu.
- `pnpm check:axiom-dashboards`, lancé en PR et avant chaque déploiement, valide chaque document contre le [schéma Axiom](https://axiom.co/docs/schemas/dashboard.json) et vérifie que chaque graphique figure au layout et que chaque requête passe par `{{environment}}`.

| Environnement | Déploiement |
|---|---|
| `staging` | CI, `Deploy - Web - Staging`, après le backend, à chaque merge sur `main` |
| `production` | CI, `Release - Web - Prod`, après le backend |
| `dev` | à la main, depuis sa branche : `AXIOM_DASHBOARDS_TOKEN=<token> pnpm deploy:axiom-dashboards dev` |

Une modification faite dans l'interface Axiom est écrasée au déploiement suivant, et un dashboard créé hors du script n'est jamais mis à jour ni supprimé. Pour itérer, modifier le fichier puis le déployer en `dev`.

## MCP Axiom

[`.mcp.json`](../../.mcp.json) déclare le serveur MCP Axiom du projet ; la première utilisation ouvre une authentification OAuth dans le navigateur (`/mcp` dans Claude Code). Il sert à explorer les datasets, tester une requête APL et lire un dashboard ; ses outils d'écriture de dashboards sont refusés dans [`.claude/settings.json`](../../.claude/settings.json).

## Requêtes et alertes

Dans Axiom — requêtes sauvegardées, monitors. Pas de copie du texte APL ici : elle dériverait en silence.
