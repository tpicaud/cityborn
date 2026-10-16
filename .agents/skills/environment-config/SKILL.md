---
name: environment-config
description: "Configuration d'environnement Cityborn. À utiliser pour ajouter, renommer, supprimer ou lire une variable d'environnement, ou modifier le schéma de configuration d'une app."
---

# Configuration d'environnement

## Règles

- Chaque app possède ses schémas zod et expose une configuration typée en camelCase.
- Le code applicatif lit cette configuration ; `process.env` n'est lu que par les modules de configuration et les points d'entrée techniques des frameworks.
- Les variables publiques Next.js et Expo sont lues par accès littéral, pour que leurs bundlers les injectent.
- Le typecheck reste indépendant de la configuration applicative.

## Phase de validation

| Contexte | Validé au |
|---|---|
| Backend NestJS | démarrage |
| Prisma | lancement de la commande |
| Variables publiques Next.js | développement et build |
| Variables privées Next.js | démarrage du serveur |
| Configuration native Expo | prébuild |
| Configuration client Expo | Metro ou EAS |

## Critère de fin

Un ajout, une suppression ou un renommage met à jour dans le même lot :

- le schéma ;
- ses consommateurs ;
- le `.env.example` de l'app ;
- la configuration Turbo concernée.
