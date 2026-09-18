---
name: issue-github
description: Issues GitHub Cityborn. À utiliser pour préparer ou publier une issue selon les conventions du projet.
---

# Règles de rédaction de tickets GitHub

## Format

- Utiliser le template existant qui correspond au besoin. Si aucun template ne convient, reprendre la structure du ticket récent le plus proche et signaler ce choix dans le brouillon.

## Règles de style
- Toujours en français.
- Ajouter les labels appropriés parmi la liste disponible sur GitHub. Demander uniquement si plusieurs labels possibles changent le routage ou la responsabilité du ticket.
- Être concis : 60 lignes maximum.
- Utiliser le Markdown seulement quand il rend le ticket plus clair.

## Autorisations

- Assigner une personne uniquement à la demande de l'utilisateur.
- Fermer ou modifier une issue existante uniquement à la demande de l'utilisateur.

## Ce qu'il ne faut pas oublier

- Lors d'une publication, rattacher l'issue au project Cityborn avec le Type `DEV` et le statut `À faire dans l'itération`.
- Toute issue publiée porte aussi un Sprint, à renseigner explicitement : le champ a une valeur par défaut qui ne correspond pas au sprint courant. Si l'utilisateur ne l'a pas précisé, lui demander lequel affecter avant de publier, en lui présentant les sprints existants (`gh project field-list 1 --owner tpicaud --format json -q '.fields[] | select(.name=="Sprint") | .options[] | "\(.id) \(.name)"'`).

## Brouillon ou publication

- « Rédige », « reformule » ou « prépare » → produire un brouillon pour relecture, sans publier.
- « Crée », « publie » ou une confirmation donnée après relecture → publier sans demander une seconde confirmation.
- Avant toute publication, effectuer une relecture interne du titre, du corps, des labels et des champs du project.
