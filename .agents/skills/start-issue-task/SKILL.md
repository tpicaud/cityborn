---
name: start-issue-task
description: Créer un worktree dédié pour une issue GitHub Cityborn existante. À utiliser uniquement quand l'utilisateur demande explicitement de lancer, créer ou déléguer une tâche isolée pour une issue. Ne pas utiliser pour développer l'issue dans l'environnement courant.
---

# Lancer une tâche dédiée à une issue

1. Résoudre l'issue exacte à partir de son numéro ou de son URL et lire son titre, son corps, ses labels et ses commentaires. Si l'identifiant manque ou reste ambigu, demander lequel utiliser.
2. Vérifier dans les tâches récentes qu'aucun travail actif ne traite déjà cette issue. Continuer la tâche existante plutôt que créer un doublon.
3. Créer une tâche pour le projet Cityborn dans un worktree, à partir de la branche par défaut sauf demande explicite d'un autre état de départ.
4. Nommer la tâche `#<numéro> — <titre concis>` lorsque l'outil le permet.
5. Lui transmettre l'URL de l'issue, son objectif, ses critères d'acceptation et l'instruction d'utiliser le skill `develop-issue` ainsi que les skills métier déclenchés par les fichiers concernés.
6. Attendre un premier état, puis rendre l'identifiant de la tâche à l'utilisateur. Si l'environnement ne permet pas de créer la tâche isolée, signaler le blocage sans développer dans le checkout principal.

La création demandée de la tâche autorise la création du worktree. Elle n'autorise pas à pousser, créer une PR, modifier l'issue ou son statut.
