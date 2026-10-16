---
name: api-conventions
description: "Conventions de packages/api, contrat public @cityborn/api. À utiliser pour ajouter, modifier ou ranger une route, un event WebSocket, un schéma, un type, un enum ou un code d'erreur."
---

# Conventions `@cityborn/api`

## Organisation

- Un domaine métier regroupe tout ce qu'il expose : routes HTTP, events WebSocket, schémas et types, identifiants brandés, enums, codes d'erreur, builders de test.
- Les routes réservées à un acteur distinct (admin) sont séparées des routes publiques, dans le même domaine.
- Le socle technique porte ce qu'aucun domaine ne possède : protocole et versions, mécanisme des channels WebSocket, format et traduction des erreurs, assemblage du contrat complet.

## Rétrocompatibilité

Les règles valent pour les routes HTTP comme pour les events WebSocket.

- Additif, donc rétrocompatible : un champ optionnel, une route, un event ou un type ajouté.
- Breaking change : rendre un champ requis, retirer ou renommer une route, un event ou un champ, resserrer un schéma.
- Une valeur d'enum ajoutée :
  - acceptée seulement en entrée : additive ;
  - émise par l'API : breaking change, sauf si les clients déjà déployés tolèrent une valeur inconnue.
- Pour remplacer un élément, créer le remplaçant à côté de l'ancien, puis déprécier l'ancien avec le skill `deprecate`.

## Garde-fous

- Demander à l'utilisateur avant tout breaking change : les builds mobile déjà déployés le subissent.
- Demander à l'utilisateur avant d'ajouter une ligne à `packages/api/tools/compat/err-ignore.txt`.

## Critère de fin

- Chaque élément ajouté vit dans son domaine, ou dans le socle s'il n'appartient à aucun.
- `pnpm check:api-compat` passe ; un breaking change signalé et non voulu ramène à l'approche additive.
- `check:api-compat` ignore le WebSocket : un changement d'event est vérifié par `pnpm --dir apps/backend test`, et aucun outil ne signale ses breaking changes.
