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
2. Délimiter le besoin selon la [taille](#taille-et-contenu) : une issue, ou une parente et ses sous-issues.
3. Rédiger chaque issue en français en remplissant chaque section de son template, selon sa référence et les [règles de contenu](#taille-et-contenu), tout dans la description, aussi court que le besoin le permet et en 60 lignes au plus, avec les labels adaptés.
4. « Rédige », « reformule », « prépare » : présenter le brouillon et s'arrêter. « Crée », « publie » ou une confirmation après relecture : continuer sans redemander.
5. Résoudre le Sprint avant toute création : la valeur par défaut du champ n'est pas le sprint courant. Sans Sprint donné par l'utilisateur, lui présenter les sprints (`gh project field-list 1 --owner tpicaud --format json`) et attendre son choix.
6. Créer chaque issue ; pour un découpage, la parente d'abord, puis chaque sous-issue après ses prérequis, dont les numéros remplacent les titres dans son `Bloquée par #…`, et la rattacher à la parente selon la [procédure](references/integration-branch.md). Ajouter chaque issue au project Cityborn (n° 1) avec :
   - Type : `DEV` ;
   - Status : `A faire dans l'itération` ;
   - Sprint : celui résolu.

## Taille et contenu

- **Taille** : une issue à développer livre un seul résultat, constatable par le joueur, l'admin ou une commande, et vérifiable seul ; repère indicatif : un diff d'environ 400 lignes et 20 fichiers, hors fichiers générés et lockfiles.
- **Découpage** : un besoin qui livre plusieurs résultats, ou dont le diff estimé dépasse nettement le repère, devient une parente, qui porte le besoin d'ensemble, et des sous-issues livrées dans sa [branche d'intégration](#branche-dintégration) :
  - chaque sous-issue est une tranche verticale à travers les couches dont son résultat a besoin ;
  - ses prérequis parmi ses sœurs ouvrent sa description : `Bloquée par #…` ;
  - une sous-issue qui excède elle-même la taille se découpe en sœurs, sous la même parente.
- **Critères** : chacun se prouve par un test, une commande ou un parcours web jouable par un agent ; un critère qui exige un appareil ou un compte tiers est suivi de « (recette manuelle) ».
- **Références** : chaque commande, skill ou fichier présenté comme existant est vérifié dans le repo dès la rédaction.
- **Citations** : une issue cite par son numéro seulement sa parente, ses sous-issues et ses sœurs ; le contexte utile d'une autre issue est repris en clair. Un lien de parenté sert seulement au découpage.

## Branche d'intégration

La **branche d'intégration** d'une parente est sa branche liée, tête de sa PR draft vers `main`, où chaque sous-issue livre sa propre PR. Pour la retrouver depuis une sous-issue, l'ouvrir, y rattacher une issue ou fermer une sous-issue livrée, lire la [procédure](references/integration-branch.md).

## Garde-fous

- Assigner, fermer ou modifier une issue seulement à la demande de l'utilisateur.
- Une issue abandonnée est supprimée (`gh issue delete`) après confirmation, jamais fermée : le project range toute issue fermée dans « En pré-production ».

## Critère de fin

Chaque issue publiée porte ses labels, suit son template, sa référence et les règles de [taille et contenu](#taille-et-contenu) ; son item de project porte son Type, son Status et son Sprint. Chaque sous-issue est rattachée à sa parente ; une branche d'intégration ouverte a sa PR draft vers `main`.
