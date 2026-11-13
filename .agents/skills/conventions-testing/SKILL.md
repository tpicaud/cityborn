---
name: conventions-testing
description: "Conventions de tests Cityborn. À utiliser pour écrire, modifier ou relire un test, choisir son niveau ou créer un builder, dans n'importe quel package ou app."
---

# Conventions de tests

## Niveau

- Un comportement est testé une seule fois, au niveau le plus bas qui permet de l'observer.
- Pour un test de `apps/backend`, lire [la référence backend](references/backend.md) : niveaux unitaire, intégration et e2e, doubles et infrastructure de test.

## React et React Native

- La couverture automatisée repose sur la logique testable sans montage React et sur les tests backend ; les parcours web sont vérifiés par la recette navigateur.
- L'absence de tests de hooks montés (effets, minuteurs, nettoyage) et de composants React ou React Native est un choix assumé.
- Conserver les outils de test existants pour les tâches courantes ; ajouter une infrastructure de tests React seulement sur demande explicite de l'utilisateur.
- Si un bug de cycle de vie React échappe aux tests existants, proposer une couverture ciblée dans le périmètre concerné avant d'élargir l'outillage.

## Structure et nommage

- Un `describe` par fonction ou méthode testée, à son nom ; sans `describe` parent qui nomme la classe, il se nomme `Classe.méthode`.
- Un `it` par comportement, décrit en anglais au présent (`rejects when the requester is not the host`), sans `should`.
- Plusieurs assertions dans un `it` sont permises si elles caractérisent ce même comportement.
- Arrange, Act et Assert sont séparés par une ligne vide.

## Builders

- Un type métier partagé a son builder dans le package qui le définit ; les tests l'importent directement, sans le redéfinir ni passer par un fichier de réexport.
- Un builder accepte des overrides typés et renvoie des données indépendantes à chaque appel ; un DTO secondaire ou une forme locale n'a pas de builder.
- Les builders servent l'Arrange, où les données du scénario restent visibles ; l'Assert écrit la valeur attendue en clair.

## Critère de fin

- Chaque comportement significatif est couvert une fois, au bon niveau.
- Chaque ressource ouverte par le test est fermée.
- La commande de test ciblée passe.
