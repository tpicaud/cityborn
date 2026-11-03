# Préparer le développement

L'orchestrateur réalise cette préparation avant de transmettre le worktree au développeur. Aucun développement n'a lieu sur le checkout principal, première entrée de `git worktree list --porcelain`.

## Retenir le worktree et la branche

1. Résoudre l'issue exacte à partir de son numéro ou de son URL.
2. Exécuter `git fetch --all --prune`, puis lire la branche liée avec `gh issue develop <numéro> --list`. Une branche locale au nom proche ne compte pas. Sans branche liée, la créer avec `gh issue develop <numéro> --base main`, puis relancer le fetch.
3. Retenir le premier worktree qui convient, la racine courante venant de `git rev-parse --show-toplevel` :
   - le worktree secondaire qui porte déjà la branche liée, où que l'on soit : l'issue y a déjà été traitée et le travail reprend là ;
   - sinon le checkout courant, s'il est secondaire, quelle que soit sa branche ou l'outil qui l'a créé ;
   - sinon un nouveau worktree au chemin `<checkout principal>/.claude/worktrees/issue-<numéro>`.
4. Si la branche liée est sur le checkout principal, l'y libérer : sans changements locaux, le ramener sur `main` avec `git -C <checkout principal> switch main` ; sinon présenter ses changements et demander une décision.
5. Dans un worktree retenu existant, lire `git status --porcelain`. En présence de changements locaux, présenter la branche et les fichiers puis demander une décision ; les conserver tels quels, sans stash, reset ni nettoyage.
6. Placer le worktree retenu sur la branche liée :
   - worktree existant sur une autre branche : `git switch <branche liée>` ;
   - nouveau worktree : `git worktree add <chemin> <branche liée>` ; bloquer si le chemin existe déjà.

## Mettre la branche à jour

1. Si `origin/<branche liée>` existe, l'intégrer avec `git merge --ff-only origin/<branche liée>`. Si l'avance rapide échoue, présenter la divergence et demander une décision.
2. Vérifier que `origin/main` est ancêtre de la branche avec `git merge-base --is-ancestor origin/main HEAD`.
3. Sinon, rebaser sur `origin/main` seulement si cela ne réécrit aucun commit publié ; sinon présenter la divergence et demander une décision.
4. Résoudre seul un conflit de rebase seulement si la résolution découle clairement de l'issue et du code actuel ; sinon laisser le rebase en cours et demander une décision.

## Préparer l'environnement

1. Exécuter `<worktree retenu>/scripts/setup-worktree.sh <chemin absolu du worktree retenu>`, sans option, même si les `.env` et `node_modules` existent déjà.
2. En cas d'échec, rendre `statut: blocked` avec la commande, la cause et l'état du checkout ; aucun sous-agent de développement ne démarre.
3. Après réussite seulement, transmettre le chemin absolu et la branche liée au développeur.
