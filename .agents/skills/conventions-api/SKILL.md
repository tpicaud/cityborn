---
name: conventions-api
description: "Conventions de packages/api, contrat public @cityborn/api. À utiliser pour ajouter, modifier, déprécier ou ranger une route, un event WebSocket, un schéma, un type, un enum ou un code d'erreur."
---

# Conventions `@cityborn/api`

## Organisation

- Un domaine métier regroupe tout ce qu'il expose : routes HTTP, events WebSocket, schémas et types, identifiants brandés, enums, codes d'erreur, builders de test.
- Les routes réservées à un acteur distinct (admin) sont séparées des routes publiques, dans le même domaine.
- Le socle technique porte le mécanisme qu'aucun domaine ne possède : protocole et versions, mécanisme des channels WebSocket, codes d'erreur techniques, erreur affichable et traduction des erreurs de validation.
- L'assemblage compose les domaines, au-dessus d'eux : contrat HTTP complet, qui ajoute à chaque route les réponses d'erreur communes, registre des channels WebSocket, union des codes d'erreur, format d'erreur typé par ces codes et ses messages.

## Rétrocompatibilité

Les règles valent pour les routes HTTP comme pour les events WebSocket.

- Additif, donc rétrocompatible : un champ optionnel, une route, un event ou un type ajouté.
- Breaking change : rendre un champ requis, retirer ou renommer une route, un event ou un champ, resserrer un schéma.
- Une valeur d'enum ajoutée :
  - acceptée seulement en entrée : additive ;
  - émise par l'API : breaking change, sauf si les clients déjà déployés tolèrent une valeur inconnue.
- Pour remplacer un élément, créer le remplaçant à côté de l'ancien, puis déprécier l'ancien avec [le marqueur de dépréciation](references/deprecation.md).

## Garde-fous

- Demander à l'utilisateur avant tout breaking change : les builds mobile déjà déployés le subissent.
- Demander à l'utilisateur avant d'ajouter une ligne à `packages/api/tools/compat/err-ignore.txt`.

## Critère de fin

- Chaque élément ajouté vit dans son domaine, dans le socle s'il n'appartient à aucun, ou dans l'assemblage s'il compose les domaines.
- `pnpm check:api-compat` passe ; un breaking change signalé et non voulu ramène à l'approche additive.
- `check:api-compat` couvre les contrats HTTP et WebSocket ; les versions sans capture WebSocket sont signalées comme non couvertes pour ce protocole.
