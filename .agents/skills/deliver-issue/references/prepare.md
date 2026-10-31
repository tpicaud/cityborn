# Préparer le développement

L'orchestrateur réalise cette préparation avant de transmettre le worktree au développeur.

## Retenir le worktree et la branche

1. Résoudre l'issue exacte à partir de son numéro ou de son URL.
2. Relever la racine courante avec `git rev-parse --show-toplevel` et les checkouts avec `git worktree list --porcelain` ; la première entrée désigne le checkout principal.
3. Exécuter `git fetch --all --prune`, puis lire la branche liée avec `gh issue develop <numéro> --list`. Une branche locale au nom proche ne compte pas. Sans branche liée, la créer avec `gh issue develop <numéro> --base main`, puis relancer le fetch.
4. Si la branche liée est occupée dans un autre checkout que celui retenu ci-dessous, bloquer et rapporter son chemin ; ne pas forcer son utilisation ni créer un second worktree pour contourner ce blocage.
   - Checkout courant secondaire : le retenir, quelle que soit sa branche initiale ou l'outil qui l'a créé.
   - Checkout courant principal : réutiliser le worktree secondaire qui porte déjà la branche liée, sinon retenir le chemin `<checkout principal>/.claude/worktrees/issue-<numéro>` à créer.
   - Un checkout explicitement demandé par l'utilisateur remplace cette sélection ; s'il s'agit du principal, cela autorise son utilisation.
5. Pour un checkout retenu existant, vérifier `git status --porcelain` avant de changer de branche ou de base. En présence de changements locaux, bloquer et les rapporter ; conserver branche et fichiers, sans stash, reset ni nettoyage automatique.
6. Utiliser la branche liée dans le worktree retenu avec `git switch <branche liée>` ; si elle n'existe que sur origin, utiliser `git switch --track origin/<branche liée>`. Pour un nouveau worktree, exécuter `git worktree add <chemin> <branche liée>` ; laisser un chemin existant intact et bloquer s'il ne correspond pas au worktree attendu.

Le checkout principal conserve sa branche et ses fichiers quand un worktree secondaire est retenu. Aucune commande de changement de branche ou de base ne s'y exécute.

## Vérifier la base

- Vérifier que `origin/main` est ancêtre de la branche liée avec `git merge-base --is-ancestor origin/main HEAD` dans le worktree retenu.
- Sinon, rebaser sur `origin/main` seulement si cela ne réécrit aucun commit publié ; si des commits publiés seraient réécrits, présenter la divergence et demander une décision avant de continuer.
- Résoudre seul un conflit seulement si la résolution découle clairement de l'issue et du code actuel ; sinon laisser le rebase en cours et demander une décision.

## Préparer l'environnement

1. Exécuter `<checkout principal>/scripts/setup-worktree.sh <chemin absolu du worktree retenu>` même si les `.env` ou `node_modules` existent déjà. Pour un checkout principal explicitement demandé, conserver ses `.env`, vérifier les `.env` des apps décrits dans le README, puis y exécuter `pnpm install` directement.
2. Vérifier le succès du script : il conserve les `.env` présents, copie les manquants depuis le principal, vérifie les `.env` requis des apps et exécute `pnpm install`. L'option `--skip-install` ne valide pas cette préparation.
3. En cas d'échec, rendre `statut: blocked` avec la commande, la cause et l'état du checkout ; aucun développement ni sous-agent de développement ne démarre.
4. Après réussite seulement, transmettre le chemin absolu et la branche liée au développeur.
