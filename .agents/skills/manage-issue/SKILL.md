---
name: manage-issue
description: "Issues GitHub Cityborn. À utiliser pour planifier une tâche ou une feature, rédiger, publier, modifier, commenter ou abandonner une issue, la rattacher au project Cityborn ou à une branche d'intégration, ou répondre à une question sur une issue."
---

# Gérer une issue

## Templates

Le template d'une issue fixe son lecteur et son registre, pour tout ce qui s'en écrit ou s'en dit : description, commentaires, questions de cadrage, réponses.

| Template | Label posé | Lecteur | Registre | Référence |
|---|---|---|---|---|
| `nouvelle-feature.md` | `Feature` | produit | produit | [Feature](references/feature.md) |
| `bug.md` | `Bug` | produit | produit | [Bug](references/bug.md) |
| `tâche-technique.md` | `Tech` | dev | technique | [Tâche technique](references/tech.md) |

- Les templates vivent dans `.github/ISSUE_TEMPLATE/`.
- Une issue existante se rattache au template dont elle porte le label ; une issue à rédiger, au template du besoin, confirmé avec l'utilisateur en cas de doute.
- Une issue sans label de template suit le registre produit.
- Le label `Tech` l'emporte : une issue qui le porte suit le registre technique, quel que soit son template.
- Lire la référence du template avant la première question ou réponse sur l'issue.
- **Registre produit** : lisible sans connaître le code ; il parle de ce que vivent le joueur ou l'admin : écrans, parcours, règles du jeu. Le détail technique se décide au développement.
- **Registre technique** : le vocabulaire du code et de l'architecture, pour un lecteur dev.
- Développer, reviewer ou livrer une issue reste technique, quel que soit son template.

## Étapes

1. Quand le besoin reste à clarifier (sujet à étudier, idée à planifier), mener d'abord le skill `grilling` dans le registre du template, jusqu'à la confirmation de l'utilisateur ; rédiger ensuite à partir des décisions prises.
2. Délimiter le besoin selon sa [taille](#taille-et-contenu) : une issue, ou une parente et ses sous-issues.
3. Rédiger chaque issue en français selon la référence du template et les [règles de contenu](#taille-et-contenu), tout dans la description, aussi court que le besoin le permet et en 60 lignes au plus, avec les labels adaptés.
4. « Rédige », « reformule », « prépare » : présenter le brouillon et s'arrêter. « Crée », « publie » ou une confirmation après relecture : continuer sans redemander.
5. Résoudre le Sprint avant toute création : la valeur par défaut du champ n'est pas le sprint courant. Sans Sprint donné par l'utilisateur, lui présenter les sprints (`gh project field-list 1 --owner tpicaud --format json`) et attendre son choix.
6. Créer chaque issue, puis l'ajouter au project Cityborn (n° 1) avec :
   - Type : `DEV` ;
   - Status : `A faire dans l'itération` ;
   - Sprint : celui résolu.

## Taille et contenu

- **Taille** : une issue livre un seul résultat, constatable par le joueur, l'admin ou une commande, et vérifiable seul ; repère indicatif : environ 400 lignes et 20 fichiers, hors fichiers générés et lockfiles.
- **Découpage** : au-delà, une parente porte le besoin d'ensemble et ses sous-issues le détail, livrées dans sa [branche d'intégration](#branche-dintégration) :
  - chaque sous-issue est une tranche verticale à travers les couches dont son résultat a besoin ;
  - elle porte ses propres critères ;
  - ses prérequis tiennent en tête de description : `Bloquée par #…` ;
  - trop grosse, elle se découpe en sœurs sous la même parente : une branche d'intégration n'a qu'un niveau.
- **Critères** : chacun se prouve par un test, une commande ou un parcours web jouable par un agent ; un critère qui exige un appareil ou un compte tiers est suivi de « (recette manuelle) ».
- **Références** : chaque commande, skill ou fichier présenté comme existant est vérifié dans le repo avant publication.
- **Citations** : une issue n'en cite une autre que si elle est sa parente, sa sous-issue ou sa sœur ; sinon, décrire le besoin sans citer l'issue, sans créer de lien de parenté pour pouvoir la citer.

## Branche d'intégration

Des sous-issues qui partent ensemble en production passent par la **branche d'intégration** de leur issue parente : la branche liée de la parente, tête de sa PR draft vers `main`. Chaque sous-issue y livre sa propre PR, seule liée à elle, et se ferme à la main au merge de cette PR : GitHub ne ferme une issue qu'au merge dans `main`. Le merge de la PR d'intégration ferme la parente.

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

## Garde-fous

- Assigner, fermer ou modifier une issue seulement à la demande de l'utilisateur.
- Une issue abandonnée est supprimée (`gh issue delete`) après confirmation, jamais fermée : le project range toute issue fermée dans « En pré-production ».

## Critère de fin

Chaque issue publiée porte ses labels, suit la référence de son template et respecte sa taille et son contenu ; son item de project porte son Type, son Status et son Sprint. Une branche d'intégration a sa PR draft ouverte vers `main`, et chaque issue qui y est destinée est sous-issue de la parente.
