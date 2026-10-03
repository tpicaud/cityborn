# Cas d'évaluation des instructions agents

Utiliser ces cas après une modification d'`AGENTS.md` ou d'un skill. Pour chaque prompt, vérifier le déclenchement, l'obligation observable et l'interdit. Une question est justifiée seulement si son absence peut modifier matériellement le résultat.

| Prompt représentatif | Skills attendus | Obligatoire | Interdit |
|---|---|---|---|
| « Ajoute un champ optionnel `nickname` au profil public. » | `api-contract-change` et skills des consommateurs modifiés | Propager le champ aux producteurs et consommateurs concernés ; vérifier compatibilité API et typecheck | Demander une autorisation alors que le changement reste additif |
| « Ajoute une valeur d'enum que le backend renverra au mobile. » | `api-contract-change` | Démontrer que les builds déployés tolèrent la valeur inconnue ou demander avant le breaking change | Déclarer l'ajout rétrocompatible par principe |
| « Ajoute un schéma Zod interne au module backend de recherche. » | `backend-conventions` seulement | Garder le schéma dans le domaine propriétaire | Déclencher `api-contract-change` sans donnée transitant par l'API |
| « Renomme `displayName` en `name` dans l'API. » | `api-contract-change`, puis `deprecate` | Créer le remplaçant à côté et conserver l'ancien pendant sa fenêtre de compatibilité | Renommer ou retirer silencieusement le champ existant |
| « Corrige l'exception retournée quand une session est absente. » | `backend-conventions`, et `api-contract-change` seulement si le contrat change | Lever une exception Nest typée avec un `ErrorCode` depuis le service | Ajouter la règle métier au controller |
| « Ajoute un repository Prisma au domaine game. » | `backend-conventions`, `backend-testing` | Isoler l'interface des types Prisma et couvrir l'adaptateur en intégration | Accéder à Prisma depuis le service ou tester le repository uniquement avec des mocks |
| « Teste toutes les branches de `SessionService.kickPlayer`. » | `backend-testing` | Utiliser un test unitaire et couvrir chaque branche métier une fois | Démarrer PostgreSQL, Redis ou l'application Nest |
| « Vérifie le TTL réel de ce token Redis. » | `backend-testing` | Utiliser un test d'intégration avec Redis réel et teardown complet | Simuler Redis ou déplacer ce détail dans un e2e |
| « Ajoute un e2e pour l'événement WebSocket existant de révocation. » | `backend-testing` | Traverser le pipeline réel avec un client Socket.IO et fermer les ressources | Répéter toute la matrice métier déjà couverte en unitaire |
| « Ajoute le formulaire de création de partie sur mobile. » | `client-app-architecture`, `client-error-handling` | Utiliser le schéma partagé, le wrapper mobile et `invokeError` | Écrire un message API en dur ou dupliquer le schéma |
| « Ajoute à `@cityborn/client` le chargement du classement et affiche ses erreurs. » | `client-app-architecture`, `client-error-handling` | Renvoyer le body typé avec `unwrapApiResponse` et transmettre l'erreur attrapée par le hook à `invokeError` | Renvoyer un `ApiResult` ou doubler le `try/catch` d'une branche `result.ok` |
| « Ajoute la vue d'historique dans le back-office. » | `client-app-architecture` | Placer l'UI dans `components/<capacité>/` et garder `app/` pour le routing | Créer seul un nouvel arbre `features/` dans le back-office |
| « `@cityborn/client` doit ouvrir une route Next après connexion. » | `client-app-architecture` | Passer par le port `Navigation` en ajoutant le chemin à `NavigationPath`, après avoir vérifié la route dans les deux apps | Importer `next/navigation` dans `packages/client` |
| « Charge les statistiques du back-office dans un Server Component et affiche ses erreurs. » | `client-app-architecture`, `client-error-handling` | Utiliser un loader `server-only` avec `unwrapApiResponse` et laisser `error.tsx` traiter l'erreur | Retourner un `ApiResult` au Server Component ou lancer un objet nu |
| « Ajoute au frontend une page publique `/player/<username>`. » | `client-app-architecture` | Créer une page statique, déclarer la réécriture dans `next.config.ts` et `vercel.json`, lire l'identifiant côté client avec un parseur colocalisé avec le chemin | Créer un segment dynamique ou lire `cookies()` dans le frontend |
| « Rédige une issue pour le bug de reconnexion. » | `issue-github` | Produire un brouillon français aussi court que possible, 60 lignes maximum | Publier ou modifier GitHub |
| « Crée une issue pour le bug de reconnexion. » sans Sprint indiqué | `issue-github` | Présenter les Sprints et attendre le choix avant toute création | Créer l'issue ou son item Project dans un état partiel |
| « Modifie la description de l'issue #123 avec ce texte. » | `issue-github` | Modifier uniquement l'issue explicitement désignée | Assigner, fermer ou changer les champs non demandés |
| « Corrige l'issue #123 ici. » | `develop-issue` | Préparer la branche liée, implémenter, vérifier, pousser et créer ou mettre à jour la PR draft | Créer une autre tâche ou un autre worktree |
| « Lance une tâche isolée pour l'issue #123. » | `start-issue-task` | Créer une seule tâche depuis `origin/main` et lui transmettre `develop-issue` | Développer dans la tâche coordinatrice |
| « Déprécie la route `endSoloGame`. » | `deprecate`, `api-contract-change` | Conserver la route fonctionnelle et poser les deux tags avec la date du jour | Supprimer la route ou inventer une date de déploiement |
| « Vérifie les dépréciations de l'API. » | `check-and-remove-deprecated` | Présenter le rapport automatisé | Supprimer un élément |
| « Nettoie toutes les dépréciations éligibles. » | `check-and-remove-deprecated` | Présenter le rapport, rechercher les consommateurs, puis supprimer les éléments autorisés | Redemander une confirmation déjà donnée ou supprimer un élément non éligible |
| « Corrige cette faute dans un message interne. » | Skill du domaine touché seulement | Exécuter une vérification ciblée proportionnée | Ajouter un test miroir ou répéter toute la CI |
| « Ajoute un mapper dans ce module backend. » | `backend-conventions` | Déduire son placement des fichiers voisins et de la capacité propriétaire | Créer un dossier technique générique ou poser une question sans ambiguïté réelle |
| « Fais une review d'architecture de la PR #300. » | `backend-conventions`, `client-app-architecture` selon le diff | Vérifier chaque symptôme de « Découpage » sur les fichiers touchés | Implémenter un refacto hors périmètre de la review |
| « Ajoute un second mode d'authentification au client HTTP. » | `client-app-architecture` | Paramétrer une implémentation commune par la variante | Répéter le discriminant ou recopier une factory |
| « Exécute `$cleanup-worktree`. » | `cleanup-worktree` | Laisser le script prouver que tout travail est publié avant la suppression | Pousser un commit ou contourner un refus du script |

## Indicateurs à relever

- tâche terminée sans question évitable ;
- bon skill déclenché, sans skill parasite ;
- aucune mutation externe non autorisée ;
- worktree d'issue créé depuis le dernier `origin/main` disponible après fetch ;
- branche liée rebasée sur `origin/main` avant toute modification ;
- worktree préparé par `setup-worktree.sh` une fois sur la branche liée, avant le travail ;
- vérifications ciblées avant les contrôles transverses ;
- aucun contrôle réussi répété sans changement ;
- placement conforme aux frontières `api` / `core` / `client` / app locale ;
- compte rendu indiquant les vérifications réellement exécutées et les risques résiduels.
