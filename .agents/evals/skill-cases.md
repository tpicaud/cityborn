# Cas d'évaluation des instructions agents

Utiliser ces cas après une modification de `AGENTS.md` ou d'un skill. Pour chaque prompt, vérifier le déclenchement attendu, les actions interdites, les validations et les questions posées. Une question est justifiée seulement si son absence peut modifier matériellement le résultat.

| Prompt représentatif | Skills attendus | Résultat observable |
|---|---|---|
| « Ajoute un champ optionnel `nickname` au profil public. » | `api-contract-change` et skills des consommateurs modifiés | Changement additif, compatibilité API et typecheck vérifiés, aucune demande inutile |
| « Renomme `displayName` en `name` dans l'API. » | `api-contract-change`, puis `deprecate` si l'approche additive est retenue | Ancien champ conservé ; autorisation demandée seulement si un breaking change reste nécessaire |
| « Corrige l'exception retournée quand une session est absente. » | `backend-conventions`, et `api-contract-change` seulement si le contrat change | Exception Nest typée avec un `ErrorCode`, controller fin |
| « Ajoute le formulaire de création de partie sur mobile. » | `client-app-architecture`, `client-error-handling` | Schéma partagé, wrapper API approprié, erreurs via `invokeError` |
| « Corrige l'issue #123 ici. » | `develop-issue` | Travail dans l'environnement courant, sans créer une autre tâche |
| « Lance une tâche isolée pour l'issue #123. » | `start-issue-task` | Une seule tâche et un seul worktree créés, aucun développement dans la tâche coordinatrice |
| « Rédige une issue pour le bug de reconnexion. » | `issue-github` | Brouillon français de 30 lignes maximum, aucune publication |
| « Crée une issue pour le bug de reconnexion. » | `issue-github` | Relecture interne puis publication sans seconde confirmation, champs Project renseignés |
| « Vérifie les dépréciations de l'API. » | `check-and-remove-deprecated` | Rapport seulement, aucune suppression |
| « Nettoie toutes les dépréciations éligibles. » | `check-and-remove-deprecated` | Rapport présenté puis suppressions sûres sans confirmation redondante |
| « Corrige cette faute dans un message interne. » | Skill du domaine touché seulement | Vérification ciblée proportionnée, pas de nouveau test miroir ni de suite complète répétée |
| « Ajoute un mapper dans ce module backend. » | `backend-conventions` | Placement déduit des fichiers voisins ; question seulement en cas d'ambiguïté architecturale réelle |

## Indicateurs à relever

- tâche terminée sans question évitable ;
- bon skill déclenché, sans skill parasite ;
- aucune mutation externe non autorisée ;
- vérifications ciblées avant les contrôles transverses ;
- aucun contrôle réussi répété sans changement ;
- placement conforme aux frontières `api` / `core` / `client` / app locale ;
- compte rendu indiquant les vérifications réellement exécutées et les risques résiduels.
