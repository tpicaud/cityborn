# Cas de déclenchement des skills

Relire ces cas quand la description d'un skill change : pour chaque prompt, seuls les skills attendus se déclenchent.

| Prompt représentatif | Skills attendus |
|---|---|
| « Ajoute un champ optionnel `nickname` au profil public. » | `conventions-api`, puis les skills de conventions des consommateurs modifiés |
| « Ajoute au contrat les routes admin des sentences. » | `conventions-api` |
| « Déprécie la route `endSoloGame`. » | `conventions-api` |
| « Ajoute un schéma Zod interne au module backend de recherche. » | `conventions-backend` seulement |
| « Corrige l'exception retournée quand une session est absente. » | `conventions-backend`, et `conventions-api` seulement si le contrat change |
| « Ajoute un repository Prisma au domaine game. » | `conventions-backend`, `conventions-testing` |
| « Teste toutes les branches de `SessionService.updateHost`. » | `conventions-testing` |
| « Ajoute un test pour `mergeSessionUpdate` dans `@cityborn/client`. » | `conventions-testing` |
| « Ajoute à `@cityborn/client` le chargement du classement. » | `conventions-client` |
| « Signale « Objet non valide » quand le brouillon de l'éditeur de catégorie est vide. » | `conventions-client` |
| « Ajoute l'écran de classement au frontend et au mobile. » | `conventions-client-apps`, `conventions-client` |
| « Ajoute au frontend une page publique `/player/<username>`. » | `conventions-client-apps` |
| « Ajoute la variable `SENTRY_DSN` au backend. » | `conventions-environment` |
| « Rédige une issue pour le bug de reconnexion. » | `write-issue` |
| « J'aimerais étudier un mode multijoueur et en faire une issue, aide-moi à planifier. » | `write-issue`, puis `grilling` avant le brouillon |
| « Développe-moi l'issue #123. » | `deliver-issue` |
| « Fais la review de la PR #300. » | `review-pr`, puis les skills de conventions des périmètres du diff |
| « Challenge-moi sur mon plan de découpage du domaine session. » | `grilling` |
| « Vérifie les dépréciations de l'API. » | `remove-deprecations` |
| « Nettoie toutes les dépréciations éligibles. » | `remove-deprecations` |
| « Ajoute au skill client une règle de nommage des hooks. » | `agent-docs`, puis `writing-for-agents` |
| « Corrige l'issue #123 ici. » quand le correctif change une règle d'un skill | `deliver-issue`, `agent-docs` |
| « Corrige l'issue #123 ici. » quand le correctif déplace un provider dans un sous-dossier | `deliver-issue` et le skill de conventions du périmètre, sans `agent-docs` |
| « Corrige cette faute dans un message interne. » | Le skill de conventions du périmètre seulement |
