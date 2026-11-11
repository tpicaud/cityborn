# Préparer le développement

L'orchestrateur réalise cette préparation avant de transmettre le worktree au développeur. Aucun développement n'a lieu sur le checkout principal, première entrée de `git worktree list --porcelain`.

## Retenir le worktree et la branche

1. Résoudre l'issue exacte à partir de son numéro ou de son URL.
2. Retenir la **branche cible**, base de la branche liée et de sa PR :
   - la branche d'intégration de l'issue parente, tête de sa PR ouverte vers `main`, quand elle existe ;
   - sinon `main`.

   ```sh
   gh api graphql -F n=<numéro> -f query='query($n:Int!){repository(owner:"tpicaud",name:"cityborn"){issue(number:$n){parent{closedByPullRequestsReferences(first:10){nodes{state baseRefName headRefName}}}}}}' \
     --jq '.data.repository.issue.parent.closedByPullRequestsReferences.nodes[]? | select(.state=="OPEN" and .baseRefName=="main") | .headRefName'
   ```
3. Exécuter `git fetch --all --prune`, puis lire la branche liée avec `gh issue develop <numéro> --list`. Une branche locale au nom proche ne compte pas. Sans branche liée, la créer avec `gh issue develop <numéro> --base <branche cible>`, puis relancer le fetch.
4. Retenir le premier worktree qui convient, la racine courante venant de `git rev-parse --show-toplevel` :
   - le worktree secondaire qui porte déjà la branche liée, où que l'on soit : l'issue y a déjà été traitée et le travail reprend là ;
   - sinon le checkout courant, s'il est secondaire, quelle que soit sa branche ou l'outil qui l'a créé ;
   - sinon un nouveau worktree au chemin `<checkout principal>/.claude/worktrees/issue-<numéro>`.
5. Si la branche liée est sur le checkout principal, l'y libérer : sans changements locaux, le ramener sur `main` avec `git -C <checkout principal> switch main` ; sinon présenter ses changements et demander une décision.
6. Dans un worktree retenu existant, lire `git status --porcelain`. En présence de changements locaux, présenter la branche et les fichiers puis demander une décision ; les conserver tels quels, sans stash, reset ni nettoyage.
7. Placer le worktree retenu sur la branche liée :
   - worktree existant sur une autre branche : `git switch <branche liée>` ;
   - nouveau worktree : `git worktree add <chemin> <branche liée>` ; bloquer si le chemin existe déjà.

## Mettre la branche à jour

1. Si `origin/<branche liée>` existe, l'intégrer avec `git merge --ff-only origin/<branche liée>`. Si l'avance rapide échoue, présenter la divergence et demander une décision.
2. Vérifier que `origin/<branche cible>` est ancêtre de la branche avec `git merge-base --is-ancestor origin/<branche cible> HEAD`.
3. Sinon, rebaser sur `origin/<branche cible>` seulement si cela ne réécrit aucun commit publié ; sinon présenter la divergence et demander une décision.
4. Résoudre seul un conflit de rebase seulement si la résolution découle clairement de l'issue et du code actuel ; sinon laisser le rebase en cours et demander une décision.

## Préparer l'environnement

1. Exécuter `<worktree retenu>/scripts/setup-worktree.sh <chemin absolu du worktree retenu>`, sans option, même si les `.env` et `node_modules` existent déjà.
2. En cas d'échec, rendre `statut: blocked` avec la commande, la cause et l'état du checkout ; aucun sous-agent de développement ne démarre.
3. Après réussite seulement, transmettre le chemin absolu, la branche liée et la branche cible au développeur.
