# Cas de déclenchement des skills

Pour chaque prompt, vérifier que seuls les skills attendus se déclenchent.

| Prompt représentatif | Skills attendus |
|---|---|
| « Ajoute un champ optionnel `nickname` au profil public. » | `conventions-api`, puis les skills de conventions des consommateurs modifiés |
| « Déprécie la route `endSoloGame`. » | `conventions-api` |
| « Ajoute un schéma Zod interne au module backend de recherche. » | `conventions-backend` seulement |
| « Corrige l'exception retournée quand une session est absente. » | `conventions-backend`, et `conventions-api` seulement si le contrat change |
| « Ajoute un repository Prisma au domaine game. » | `conventions-backend`, `conventions-testing` |
| « Renomme le champ `durationMs` des wide events. » | `conventions-backend` seulement |
| « Ajoute un dashboard Axiom des connexions WebSocket. » | `conventions-backend`, `axiom-building-dashboards` |
| « Ajoute un test pour `isHostOf` dans `@cityborn/client`. » | `conventions-testing`, sans `execute-ui-scenarios` |
| « Ajoute à `@cityborn/client` le chargement du classement. » | `conventions-client` |
| « Ajoute l'écran de classement au frontend et au mobile. » | `conventions-client-apps`, `conventions-client` |
| « Ajoute au frontend une page publique `/player/<username>`. » | `conventions-client-apps` |
| « Ajoute la variable `SENTRY_DSN` au backend. » | `conventions-environment` |
| « Rédige une issue pour le bug de reconnexion. » | `manage-issue` |
| « J'aimerais étudier un mode multijoueur et en faire une issue, aide-moi à planifier. » | `manage-issue`, puis `grilling` avant le brouillon |
| « Explique-moi ce que demande l'issue #400. » | `manage-issue` |
| « Ouvre une branche d'intégration pour #500 et rattaches-y #501 et #502. » | `manage-issue`, sans `deliver-issue` |
| « Développe-moi l'issue #123. » | `deliver-issue`, puis `execute-ui-scenarios` en dernière étape si un parcours est jouable en web desktop |
| « Développe #501. », sous-issue de #500 sans PR d'intégration | `deliver-issue`, `manage-issue` pour ouvrir l'intégration de #500, puis `execute-ui-scenarios` |
| « Fais la recette web de la PR #300 avec les scénarios de sa description. » | `execute-ui-scenarios`, sans `deliver-issue` |
| « Fais la recette desktop du back-office avec ces scénarios. » | `execute-ui-scenarios`, sans `deliver-issue` |
| « Rejoue dans ce checkout les scénarios fournis. » | `execute-ui-scenarios`, sans `deliver-issue` ni `manage-issue` |
| « Livre une modification mobile. » | `deliver-issue`, sans `execute-ui-scenarios` : aucun parcours web desktop |
| « Explique-moi les scénarios de recette de cette PR sans les exécuter. » | Pas de `execute-ui-scenarios` |
| « Fais la review de la PR #300. » | `review-pr`, puis les skills de conventions des périmètres du diff |
| « Challenge-moi sur mon plan de découpage du domaine session. » | `grilling` |
| « Vérifie les dépréciations de l'API. » | `remove-deprecations` |
| « Nettoie toutes les dépréciations éligibles. » | `remove-deprecations` |
| « Ajoute au skill client une règle de nommage des hooks. » | `agent-docs`, puis `writing-for-agents` |
| « Corrige l'issue #123 ici. » quand le correctif change une règle d'un skill | `deliver-issue`, `agent-docs` |
| « Corrige l'issue #123 ici. » quand le correctif déplace un provider dans un sous-dossier | `deliver-issue` et le skill de conventions du périmètre, sans `agent-docs` |
