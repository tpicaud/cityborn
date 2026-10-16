---
name: write-issue
description: "Issues GitHub Cityborn. À utiliser pour rédiger, publier, modifier ou abandonner une issue et la rattacher au project Cityborn."
---

# Rédiger une issue

## Étapes

1. Partir du template de `.github/ISSUE_TEMPLATE/` adapté au besoin ; sans template adapté, reprendre la structure de l'issue récente la plus proche et le signaler.
2. Rédiger en français, aussi court que le besoin le permet et en 60 lignes au plus, avec les labels adaptés.
   - Issue `Feature` : la description parle le langage produit, lisible par un non-tech (ce que vivent le joueur ou l'admin, ce qui est hors périmètre) ; les indications d'implémentation vont dans un commentaire « Implémentation » séparé.
3. « Rédige », « reformule », « prépare » : présenter le brouillon et s'arrêter. « Crée », « publie » ou une confirmation après relecture : continuer sans redemander.
4. Résoudre le Sprint avant toute création : la valeur par défaut du champ n'est pas le sprint courant. Sans Sprint donné par l'utilisateur, lui présenter les sprints (`gh project field-list 1 --owner tpicaud --format json`) et attendre son choix.
5. Créer l'issue, poster son commentaire « Implémentation » s'il existe, puis l'ajouter au project Cityborn (n° 1) avec :
   - Type : `DEV` ;
   - Status : `A faire dans l'itération` ;
   - Sprint : celui résolu.

## Garde-fous

- Assigner, fermer ou modifier une issue seulement à la demande de l'utilisateur.
- Une issue abandonnée est supprimée (`gh issue delete`) après confirmation, jamais fermée : le project range toute issue fermée dans « En production ».

## Critère de fin

L'issue publiée porte ses labels et, pour une `Feature`, une description sans détail d'implémentation ; son item de project son Type, son Status et son Sprint.
