# Cas d'évaluation des instructions agents

Utiliser ces cas après une modification d'`AGENTS.md` ou d'un skill. Pour chaque prompt, vérifier le déclenchement, l'obligation observable et l'interdit. Une question est justifiée seulement si son absence peut modifier matériellement le résultat.

| Prompt représentatif | Skills attendus | Obligatoire | Interdit |
|---|---|---|---|
| « Ajoute un champ optionnel `nickname` au profil public. » | `conventions-api` et skills des consommateurs modifiés | Propager le champ aux producteurs et consommateurs concernés ; vérifier compatibilité API et typecheck | Demander une autorisation alors que le changement reste additif |
| « Ajoute au contrat les routes admin des sentences. » | `conventions-api` | Placer les routes dans le domaine `sentence`, séparées de ses routes publiques | Créer un fichier dans un dossier technique transverse au lieu du domaine |
| « Ajoute une valeur d'enum que le backend renverra au mobile. » | `conventions-api` | Démontrer que les builds déployés tolèrent la valeur inconnue ou demander avant le breaking change | Déclarer l'ajout rétrocompatible par principe |
| « Ajoute un schéma Zod interne au module backend de recherche. » | `conventions-backend` seulement | Garder le schéma dans le domaine propriétaire | Déclencher `conventions-api` sans donnée transitant par l'API |
| « Renomme `displayName` en `name` dans l'API. » | `conventions-api` | Créer le remplaçant à côté et conserver l'ancien pendant sa fenêtre de compatibilité | Renommer ou retirer silencieusement le champ existant |
| « Corrige l'exception retournée quand une session est absente. » | `conventions-backend`, et `conventions-api` seulement si le contrat change | Lever une exception Nest typée avec un `ErrorCode` depuis le service | Ajouter la règle métier au controller |
| « Ajoute un repository Prisma au domaine game. » | `conventions-backend`, `conventions-testing` | Isoler l'interface des types Prisma et couvrir l'adaptateur en intégration | Accéder à Prisma depuis le service ou tester le repository uniquement avec des mocks |
| « Teste toutes les branches de `SessionService.updateHost`. » | `conventions-testing` | Utiliser un test unitaire et couvrir chaque branche métier une fois | Démarrer PostgreSQL, Redis ou l'application Nest |
| « Vérifie le TTL réel de ce token Redis. » | `conventions-testing` | Utiliser un test d'intégration avec Redis réel et teardown complet | Simuler Redis ou déplacer ce détail dans un e2e |
| « Ajoute un e2e pour l'événement WebSocket existant de révocation. » | `conventions-testing` | Traverser le pipeline réel avec un client Socket.IO et fermer les ressources | Répéter toute la matrice métier déjà couverte en unitaire |
| « Ajoute un test pour `mergeSessionUpdate` dans `@cityborn/client`. » | `conventions-testing` | Ouvrir un `describe('mergeSessionUpdate')`, construire la session avec le builder de `@cityborn/api` et écrire la valeur attendue en clair | Redéfinir une fonction locale qui construit la session ou écrire des `test()` à plat |
| « Ajoute le formulaire de création de partie sur mobile. » | `conventions-client-apps`, `conventions-client` | Valider avec `zodResolver` et le schéma partagé, et signaler les erreurs par `reportError` | Écrire un message API en dur ou dupliquer le schéma |
| « Signale « Objet non valide » quand le brouillon de l'éditeur de catégorie est vide. » | `conventions-client` | Passer `new UserFacingError(message)` à `reportError` | Signaler une chaîne nue ou compter sur `Error.message` pour l'affichage |
| « Ajoute à `@cityborn/client` le chargement du classement et affiche ses erreurs. » | `conventions-client` | Ajouter le port et la query dans `domains/<domaine>/`, avec `unwrapApiResponse`, `staleTime`, `retry` et `meta.reportsError`, puis le hook dans sa feature | Charger par `useEffect`, attraper l'erreur du `queryFn` ou appeler le contrat depuis la feature |
| « Ajoute l'écran de classement au frontend et au mobile. » | `conventions-client-apps` | Donner le même découpage aux deux apps et nommer dans la PR chaque écart imposé par la plateforme | Diverger sans raison de plateforme, ou plier une app à une implémentation miroir qui lui convient mal |
| « Ajoute la vue d'historique dans le back-office. » | `conventions-client-apps` | Placer les vues dans `features/<feature>/` et laisser le routing assembler | Mettre la logique ou l'accès API dans le dossier de routing |
| « `@cityborn/client` doit ouvrir une route Next après connexion. » | `conventions-client` | Passer par le port `Navigation` en ajoutant le chemin à `NavigationPath`, après avoir vérifié la route dans les apps | Importer `next/navigation` dans `packages/client` |
| « Charge les statistiques du back-office et affiche ses erreurs. » | `conventions-client`, `conventions-client-apps` | Ajouter l'appel au port du domaine dans `domains/`, sa query, puis un hook de la feature `admin` branché sur la vue | Appeler le contrat depuis un composant du back-office, charger par `useEffect` ou créer une server action |
| « Expose aux apps un hook de statistiques du profil. » | `conventions-client` | Nommer `useProfileStats(options): ProfileStats` avec un objet nommé en retour, puis ajouter hook, options et retour à la liste explicite de l'index | Ajouter un `export *`, renvoyer une valeur nue ou exporter un helper sans consommateur dans une app |
| « Ajoute au frontend une page publique `/player/<username>`. » | `conventions-client-apps` | Créer une page statique, déclarer la réécriture dans `next.config.ts` et `vercel.json`, lire l'identifiant avec un parseur colocalisé avec le chemin | Créer un segment dynamique ou lire `cookies()` dans le frontend |
| « Rédige une issue pour le bug de reconnexion. » | `write-issue` | Produire un brouillon français aussi court que possible, 60 lignes maximum | Publier ou modifier GitHub |
| « Crée une issue pour le bug de reconnexion. » sans Sprint indiqué | `write-issue` | Présenter les Sprints et attendre le choix avant toute création | Créer l'issue ou son item Project dans un état partiel |
| « Modifie la description de l'issue #123 avec ce texte. » | `write-issue` | Modifier uniquement l'issue explicitement désignée | Assigner, fermer ou changer les champs non demandés |
| « Développe-moi l'issue #123. » | `deliver-issue` | Enchaîner dev, review et correctifs, chacun dans un sous-agent au contexte neuf, dans le checkout courant | Lire le diff dans l'orchestrateur ou créer une autre tâche ou un autre worktree |
| « Délivre-moi l'issue #123. » | `deliver-issue` | Transmettre au reviewer uniquement l'issue et la PR, puis au sous-agent de correctifs les findings dans le périmètre | Transmettre au reviewer le rapport du dev |
| « Corrige l'issue #123 ici. » avec des changements non commités dans le checkout | `deliver-issue` | Relayer à l'utilisateur la question d'un sous-agent `blocked`, puis reprendre l'étape avec sa réponse | Laisser un sous-agent trancher seul une question destinée à l'utilisateur |
| « Déprécie la route `endSoloGame`. » | `conventions-api` | Conserver la route fonctionnelle et poser les deux tags avec la date du jour | Supprimer la route ou inventer une date de déploiement |
| « Vérifie les dépréciations de l'API. » | `remove-deprecations` | Présenter le rapport automatisé | Supprimer un élément |
| « Nettoie toutes les dépréciations éligibles. » | `remove-deprecations` | Présenter le rapport, rechercher les consommateurs, puis supprimer les éléments autorisés | Redemander une confirmation déjà donnée ou supprimer un élément non éligible |
| « Corrige cette faute dans un message interne. » | Skill du domaine touché seulement | Exécuter une vérification ciblée proportionnée | Ajouter un test miroir ou répéter toute la CI |
| « Ajoute un mapper dans ce module backend. » | `conventions-backend` | Déduire son placement des fichiers voisins et de la capacité propriétaire | Créer un dossier technique générique ou poser une question sans ambiguïté réelle |
| « Fais la review de la PR #300. » | `review-pr`, puis les skills de conventions des périmètres du diff | Confronter chaque fichier du diff à chaque axe de la checklist et rendre des findings confirmés par le code | Modifier le code ou publier sur GitHub sans demande |
| « Fais une review d'architecture de la PR #300. » | `review-pr`, puis les skills de conventions des périmètres du diff | Vérifier chaque symptôme de « Découpage » sur les fichiers touchés | Implémenter un refacto hors périmètre de la review |
| « Ajoute un second mode d'authentification au client HTTP. » | `conventions-client` | Paramétrer une implémentation commune par la variante | Répéter le discriminant ou recopier une factory |
| « Ajoute au skill client une règle de nommage des hooks. » | `agent-docs`, puis `writing-for-agents` | Charger les deux skills avant la première modification, écrire la règle une seule fois dans le skill client, puis lancer `pnpm check:agent-docs` | Recopier la règle dans `AGENTS.md` |
| « Réécris la section Style de code d'`AGENTS.md`. » | `agent-docs`, puis `writing-for-agents` | Découper chaque obligation en bullet, lancer `pnpm check:agent-docs` et relire les cas concernés | Modifier `writing-for-agents` pour y ajouter une convention Cityborn |
| « Ajoute la variable `SENTRY_DSN` au backend. » | `conventions-environment` | Mettre à jour dans le même lot le schéma, ses consommateurs, le `.env.example` et la configuration Turbo | Lire `process.env` hors du module de configuration |
| « Corrige l'issue #123 ici. » quand le correctif change une règle documentée dans un fichier de référence d'un skill | `deliver-issue`, skill du domaine, `agent-docs` | Charger `agent-docs` avant de retoucher le skill ou sa référence | Mettre à jour la doc agent par une retouche `sed` ou un script sans l'avoir chargé |
| « Corrige l'issue #123 ici. » quand le correctif déplace un provider dans un sous-dossier | `deliver-issue`, skill du domaine | Laisser la doc agents inchangée : la règle Rangement couvre déjà le déplacement | Ajouter le chemin du fichier ou le détail du correctif à un skill |

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
- placement conforme aux axes d'organisation et au sens des dépendances d'`AGENTS.md` ;
- compte rendu indiquant les vérifications réellement exécutées et les risques résiduels.
