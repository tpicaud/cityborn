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
| « Ajoute à `@cityborn/client` le chargement du classement et affiche ses erreurs. » | `client-app-architecture`, `client-error-handling` | Renvoyer le body typé avec `unwrapApiResponse` depuis `api/<domaine>Api.ts`, puis lire la query de `api/<domaine>Queries.ts` déclarée avec `staleTime`, `retry` et `meta: { reportsError: true }` | Charger par `useEffect`, attraper l'erreur du `queryFn` ou renvoyer un `ApiResult` |
| « Ajoute l'écran de classement au frontend et au mobile. » | `client-app-architecture` | Donner le même découpage aux deux apps et nommer dans la PR chaque écart imposé par la plateforme | Diverger sans raison de plateforme, ou plier une app à une implémentation miroir qui lui convient mal |
| « Ajoute la vue d'historique dans le back-office. » | `client-app-architecture` | Placer l'UI dans `components/<capacité>/` et garder `app/` pour le routing | Créer seul un nouvel arbre `features/` dans le back-office |
| « `@cityborn/client` doit ouvrir une route Next après connexion. » | `client-app-architecture` | Passer par le port `Navigation` en ajoutant le chemin à `NavigationPath`, après avoir vérifié la route dans les deux apps | Importer `next/navigation` dans `packages/client` |
| « Charge les statistiques du back-office et affiche ses erreurs. » | `client-app-architecture`, `client-error-handling` | Appeler l'API depuis `apps/back-office/lib/api/` avec `unwrapApiResponse` et transmettre l'erreur attrapée à `invokeError` | Créer une server action ou un loader de Server Component, ou retourner un `ApiResult` |
| « Ajoute au frontend une page publique `/player/<username>`. » | `client-app-architecture` | Créer une page statique, déclarer la réécriture dans `next.config.ts` et `vercel.json`, lire l'identifiant côté client avec un parseur colocalisé avec le chemin | Créer un segment dynamique ou lire `cookies()` dans le frontend |
| « Rédige une issue pour le bug de reconnexion. » | `issue-github` | Produire un brouillon français aussi court que possible, 60 lignes maximum | Publier ou modifier GitHub |
| « Crée une issue pour le bug de reconnexion. » sans Sprint indiqué | `issue-github` | Présenter les Sprints et attendre le choix avant toute création | Créer l'issue ou son item Project dans un état partiel |
| « Modifie la description de l'issue #123 avec ce texte. » | `issue-github` | Modifier uniquement l'issue explicitement désignée | Assigner, fermer ou changer les champs non demandés |
| « Développe-moi l'issue #123. » | `deliver-issue` | Enchaîner dev, review et correctifs, chacun dans un sous-agent au contexte neuf, dans le checkout courant | Lire le diff dans l'orchestrateur ou créer une autre tâche ou un autre worktree |
| « Délivre-moi l'issue #123. » | `deliver-issue` | Transmettre au reviewer uniquement l'issue et la PR, puis au sous-agent de correctifs les findings dans le périmètre | Transmettre au reviewer le rapport du dev |
| « Corrige l'issue #123 ici. » avec des changements non commités dans le checkout | `deliver-issue` | Relayer à l'utilisateur la question d'un sous-agent `blocked`, puis reprendre l'étape avec sa réponse | Laisser un sous-agent trancher seul une question destinée à l'utilisateur |
| « Lance une tâche isolée pour l'issue #123. » | `start-issue-task` | Créer une seule tâche depuis `origin/main` et lui transmettre `deliver-issue` | Développer dans la tâche coordinatrice |
| « Déprécie la route `endSoloGame`. » | `deprecate`, `api-contract-change` | Conserver la route fonctionnelle et poser les deux tags avec la date du jour | Supprimer la route ou inventer une date de déploiement |
| « Vérifie les dépréciations de l'API. » | `check-and-remove-deprecated` | Présenter le rapport automatisé | Supprimer un élément |
| « Nettoie toutes les dépréciations éligibles. » | `check-and-remove-deprecated` | Présenter le rapport, rechercher les consommateurs, puis supprimer les éléments autorisés | Redemander une confirmation déjà donnée ou supprimer un élément non éligible |
| « Corrige cette faute dans un message interne. » | Skill du domaine touché seulement | Exécuter une vérification ciblée proportionnée | Ajouter un test miroir ou répéter toute la CI |
| « Ajoute un mapper dans ce module backend. » | `backend-conventions` | Déduire son placement des fichiers voisins et de la capacité propriétaire | Créer un dossier technique générique ou poser une question sans ambiguïté réelle |
| « Fais la review de la PR #300. » | `review-pr` et skills métier du diff | Confronter chaque fichier du diff à chaque axe de la checklist et rendre des findings confirmés par le code | Modifier le code ou publier sur GitHub sans demande |
| « Fais une review d'architecture de la PR #300. » | `review-pr`, `backend-conventions`, `client-app-architecture` selon le diff | Vérifier chaque symptôme de « Découpage » sur les fichiers touchés | Implémenter un refacto hors périmètre de la review |
| « Ajoute un second mode d'authentification au client HTTP. » | `client-app-architecture` | Paramétrer une implémentation commune par la variante | Répéter le discriminant ou recopier une factory |
| « Ajoute la commande `pnpm db:seed` au tableau des commandes. » | `writing-for-agents` | Charger le skill avant la première modification d'`AGENTS.md` | Modifier le guide avant de l'avoir chargé |
| « Corrige l'issue #123 ici. » quand le correctif change une règle documentée dans un fichier de référence d'un skill | `deliver-issue`, skill du domaine, `writing-for-agents` | Charger `writing-for-agents` avant de retoucher le skill ou sa référence | Mettre à jour la doc agent par une retouche `sed` ou un script sans l'avoir chargé |
| « Exécute `$cleanup-worktree`. » | `cleanup-worktree` | Laisser le script prouver que tout travail est publié avant la suppression | Pousser un commit ou contourner un refus du script |

## Indicateurs à relever

- tâche terminée sans question évitable ;
- bon skill déclenché, sans skill parasite ;
- aucune mutation externe non autorisée ;
- worktree d'issue créé depuis le dernier `origin/main` disponible après fetch ;
- branche liée rebasée sur `origin/main` avant toute modification ;
- issue délivrée par trois sous-agents successifs, le reviewer ignorant le rapport du dev ;
- worktree préparé par `setup-worktree.sh` une fois sur la branche liée, avant le travail ;
- vérifications ciblées avant les contrôles transverses ;
- aucun contrôle réussi répété sans changement ;
- placement conforme aux frontières `api` / `core` / `client` / app locale ;
- compte rendu indiquant les vérifications réellement exécutées et les risques résiduels.
