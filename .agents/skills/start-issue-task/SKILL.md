---
name: start-issue-task
description: Tâche isolée pour une issue GitHub Cityborn. À utiliser uniquement quand l'utilisateur demande explicitement de créer ou déléguer un worktree dédié ; le checkout courant relève de develop-issue.
---

# Lancer une tâche dédiée à une issue

1. Résoudre l'issue exacte à partir de son numéro ou de son URL et lire son titre, son corps, ses labels et ses commentaires. Si l'identifiant manque ou reste ambigu, demander lequel utiliser.
2. Vérifier dans les tâches récentes qu'aucun travail actif ne traite déjà cette issue. Continuer la tâche existante plutôt que créer un doublon.
3. Dans le checkout enregistré du projet, exécuter `git fetch --all --prune` et vérifier que `origin/main` existe. Ne pas supposer que le `main` local est à jour.
4. Créer une tâche pour le projet Cityborn dans un worktree démarré depuis `origin/main`, sauf demande explicite d'un autre état de départ.
5. Nommer la tâche `#<numéro> — <titre concis>` lorsque l'outil le permet.
6. Lui transmettre l'URL de l'issue, son objectif, ses critères d'acceptation et l'instruction d'utiliser le skill `develop-issue` ainsi que les skills métier déclenchés par les fichiers concernés.
7. Attendre un premier état, puis rendre l'identifiant de la tâche à l'utilisateur. Si l'environnement ne permet pas de créer la tâche isolée, signaler le blocage sans développer dans le checkout principal.

La création demandée de la tâche autorise la création du worktree. Elle n'autorise pas à pousser, créer une PR, modifier l'issue ou son statut.
