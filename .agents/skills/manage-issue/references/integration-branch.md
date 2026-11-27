# Branche d'intégration

Chaque sous-issue livre dans la branche d'intégration sa propre PR, seule liée à elle, et se ferme à la main au merge de cette PR : GitHub ne ferme une issue qu'au merge dans `main`. La parente se ferme au merge de sa PR d'intégration quand celle-ci vise `main`, sinon à la main comme toute sous-issue.

1. Retrouver la branche d'intégration de la parente d'une issue :

   ```sh
   gh api graphql -F n=<numéro> -f query='query($n:Int!){repository(owner:"tpicaud",name:"cityborn"){issue(number:$n){parent{number closedByPullRequestsReferences(first:10){nodes{state headRefName}}}}}}' \
     --jq '.data.repository.issue.parent // empty | {parent: .number, integration: [.closedByPullRequestsReferences.nodes[] | select(.state=="OPEN") | .headRefName]}'
   ```

   - sortie vide : l'issue n'a pas de parente ;
   - un seul élément dans `integration` : la branche d'intégration de la parente ;
   - liste `integration` vide : l'intégration est à ouvrir, à l'étape 2 ;
   - plusieurs éléments : présenter leurs PR à l'utilisateur et lui demander laquelle retenir.
2. Ouvrir la branche d'intégration de la parente avant le développement de sa première sous-issue, sans toucher au checkout courant :
   - **base** : lancer l'étape 1 sur la parente elle-même. Une sortie vide donne `main` ; sinon la base est la branche d'intégration retrouvée, à ouvrir d'abord par cette étape 2 si la liste est vide ;
   - **branche** : `<branche>` vaut `feature/<parente>-<slug>`, avec un slug court en anglais tiré du titre de la parente ;
   - créer la branche liée de la parente avec `gh issue develop <parente> --base <base> --name <branche>` ;
   - y pousser un commit vide, sans checkout :

     ```sh
     git fetch origin <branche> && git push origin "$(git commit-tree 'origin/<branche>^{tree}' -p origin/<branche> -m 'chore: open integration branch')":refs/heads/<branche>
     ```
   - ouvrir la PR draft : `gh pr create --draft --base <base> --head <branche> --title "#<parente> - <titre de la parente>" --body "Closes #<parente>"` ;
   - la [lier à la parente](../SKILL.md#lien-dune-pr-à-son-issue), avec `<branche>` pour désigner la PR.
3. Rattacher à la parente chaque issue destinée à cette branche, existante ou nouvelle : `gh api repos/tpicaud/cityborn/issues/<parente>/sub_issues -F sub_issue_id="$(gh api repos/tpicaud/cityborn/issues/<numéro> --jq .id)"`.
