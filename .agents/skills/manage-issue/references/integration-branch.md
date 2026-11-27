# Branche d'intégration

Chaque sous-issue livre dans la branche d'intégration sa propre PR, seule liée à elle, et se ferme à la main au merge de cette PR : GitHub ne ferme une issue qu'au merge dans `main`. Le merge de la PR d'intégration ferme la parente.

1. Retrouver la branche d'intégration de la parente d'une issue :

   ```sh
   gh api graphql -F n=<numéro> -f query='query($n:Int!){repository(owner:"tpicaud",name:"cityborn"){issue(number:$n){parent{number closedByPullRequestsReferences(first:10){nodes{state headRefName}}}}}}' \
     --jq '.data.repository.issue.parent // empty | {parent: .number, integration: [.closedByPullRequestsReferences.nodes[] | select(.state=="OPEN") | .headRefName]}'
   ```

   Une sortie vide signale une issue sans parente ; une liste `integration` vide, une intégration à ouvrir.
2. Ouvrir la branche d'intégration avant le développement de la première sous-issue, sans toucher au checkout courant, sur sa base : `main`, ou la branche d'intégration de la parente de la parente, retrouvée par l'étape 1 :
   - créer la branche liée de la parente avec `gh issue develop <parente> --base <base>` ;
   - y pousser un commit vide, sans checkout :

     ```sh
     git fetch origin <branche> && git push origin "$(git commit-tree 'origin/<branche>^{tree}' -p origin/<branche> -m 'chore: open integration branch')":refs/heads/<branche>
     ```
   - ouvrir la PR draft vers sa base au titre de la parente, avec `Closes #<parente>` ;
   - vers une autre base que `main`, `Closes #<parente>` ne lie pas la PR à la parente : la lier avec

     ```sh
     gh api graphql -f issue="$(gh issue view <parente> --json id -q .id)" -f pr="$(gh pr view <PR> --json id -q .id)" \
       -f query='mutation($issue:ID!,$pr:ID!){addCloseIssueReferences(input:{issueId:$issue,pullRequestIds:[$pr]}){clientMutationId}}'
     ```
3. Rattacher à la parente chaque issue destinée à cette branche, existante ou nouvelle : `gh api repos/tpicaud/cityborn/issues/<parente>/sub_issues -F sub_issue_id="$(gh api repos/tpicaud/cityborn/issues/<numéro> --jq .id)"`.
