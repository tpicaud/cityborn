---
name: conventions-testing
description: "Conventions de tests Cityborn. À utiliser pour écrire, modifier ou relire un test, choisir son niveau ou créer un builder, dans n'importe quel package ou app."
---

# Conventions de tests

## Niveau

- Un comportement est testé une seule fois, au niveau le plus bas qui permet de l'observer.
- Pour un test de `apps/backend`, lire [la référence backend](references/backend.md) : niveaux unitaire, intégration et e2e, doubles et infrastructure de test.

## Nommage et structure

- Un test décrit en anglais un comportement au présent (`rejects when the requester is not the host`), sans `should`.
- Un test couvre un seul comportement ; plusieurs assertions sont permises si elles caractérisent ce même résultat.
- Arrange, Act et Assert sont séparés par une ligne vide.

## Builders

- Un type métier partagé a son builder dans le package qui le définit ; les tests l'importent directement, sans le redéfinir ni passer par un fichier de réexport.
- Un builder accepte des overrides typés et renvoie des données indépendantes à chaque appel ; un DTO secondaire ou une forme locale n'a pas de builder.
- Les builders servent l'Arrange, où les données du scénario restent visibles ; l'Assert écrit la valeur attendue en clair.

## Critère de fin

- Chaque comportement significatif est couvert une fois, au bon niveau.
- Chaque ressource ouverte par le test est fermée.
- La commande de test ciblée passe.
