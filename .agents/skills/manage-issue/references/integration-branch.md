# Branche d'intégration

Chaque sous-issue livre dans la branche d'intégration sa propre PR, seule liée à elle, et se ferme à la main au merge de cette PR : GitHub ne ferme une issue qu'au merge dans `main`. Le merge de la PR d'intégration ferme la parente.

1. Retrouver la branche d'intégration de la parente d'une issue :

   ```sh
   gh api graphql -F n=<numéro> -f query='query($n:Int!){repository(owner:"tpicaud",name:"cityborn"){issue(number:$n){parent{number closedByPullRequestsReferences(first:10){nodes{state baseRefName headRefName}}}}}}' \
     --jq '.data.repository.issue.parent // empty | {parent: .number, integration: [.closedByPullRequestsReferences.nodes[] | select(.state=="OPEN" and .baseRefName=="main") | .headRefName]}'
   ```

   Une sortie vide signale une issue sans parente ; une liste `integration` vide, une intégration à ouvrir.
2. Ouvrir la branche d'intégration avant le développement de la première sous-issue, sans toucher au checkout courant :
   - créer la branche liée de la parente avec `gh issue develop <parente> --base main` ;
   - y pousser un commit vide, sans checkout :

     ```sh
     git fetch origin <branche> && git push origin "$(git commit-tree 'origin/<branche>^{tree}' -p origin/<branche> -m 'chore: open integration branch')":refs/heads/<branche>
     ```
   - ouvrir la PR draft vers `main` au titre de la parente, avec `Closes #<parente>`.
3. Rattacher à la parente chaque issue destinée à cette branche, existante ou nouvelle : `gh api repos/tpicaud/cityborn/issues/<parente>/sub_issues -F sub_issue_id="$(gh api repos/tpicaud/cityborn/issues/<numéro> --jq .id)"`.
