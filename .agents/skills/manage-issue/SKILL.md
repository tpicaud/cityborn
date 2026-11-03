---
name: manage-issue
description: "Issues GitHub Cityborn. À utiliser pour planifier une tâche ou une feature, rédiger, publier, modifier, commenter ou abandonner une issue et la rattacher au project Cityborn, ou répondre à une question sur une issue."
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
2. Rédiger en français selon la référence du template, tout dans la description, aussi court que le besoin le permet et en 60 lignes au plus, avec les labels adaptés.
3. « Rédige », « reformule », « prépare » : présenter le brouillon et s'arrêter. « Crée », « publie » ou une confirmation après relecture : continuer sans redemander.
4. Résoudre le Sprint avant toute création : la valeur par défaut du champ n'est pas le sprint courant. Sans Sprint donné par l'utilisateur, lui présenter les sprints (`gh project field-list 1 --owner tpicaud --format json`) et attendre son choix.
5. Créer l'issue, puis l'ajouter au project Cityborn (n° 1) avec :
   - Type : `DEV` ;
   - Status : `A faire dans l'itération` ;
   - Sprint : celui résolu.

## Garde-fous

- Assigner, fermer ou modifier une issue seulement à la demande de l'utilisateur.
- Une issue abandonnée est supprimée (`gh issue delete`) après confirmation, jamais fermée : le project range toute issue fermée dans « En production ».

## Critère de fin

L'issue publiée porte ses labels et suit la référence de son template ; son item de project porte son Type, son Status et son Sprint.
