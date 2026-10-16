# Cityborn — guide pour agents

Monorepo pnpm/turbo, TypeScript partout. Ce fichier ne porte que le contexte transverse au monorepo ; les conventions propres à un domaine, une app ou un workflow vivent dans les skills de `.agents/skills/`.

## Règles prioritaires

### Type-safe

- Aucun `any`.
- Corriger un type en amont (narrowing, generics, schéma zod), sans cast `as`, `@ts-ignore` ni `biome-ignore`.
- Identifiants métier : types brandés de `@cityborn/api`, validés une fois à l'entrée du domaine puis propagés.

### Architecture

- Chaque package ou app suit l'axe d'organisation que lui attribue la [vue d'ensemble](#vue-densemble).
- Un domaine métier porte le même nom dans chaque package ou app organisé par domaine métier.
- Une feature compose un ou plusieurs domaines et n'existe que dans les packages et apps organisés par feature.
- Les dépendances vont toujours du spécifique vers le partagé, sans cycle :
  - app → package
  - feature → domaine métier → socle technique
- Un écart à ces règles est corrigé dans le périmètre de la tâche ; hors périmètre, il est signalé en fin de réponse avec une piste, sans refacto.

#### Découpage

S'applique à l'intérieur d'un domaine métier, d'une feature ou du socle technique.

- **Module profond** : un module (service, hook, sous-dossier) couvre une responsabilité entière derrière une surface publique courte ; ses étapes, dépendances et configuration restent privées.
  - Symptôme : l'appelant transmet un secret, un client d'infrastructure ou une option interne.
  - Symptôme : un export que seul son propre fichier lit.
- **Variantes** : quand une même responsabilité a deux implémentations ou plus, un seul module porte le commun et reçoit la partie variable (port, stratégie, fonction injectée).
  - Symptômes : le même discriminant testé à plusieurs endroits ; des classes sœurs qui ne diffèrent que d'une méthode ; des factories recopiées.
- **Cohésion** : une notion a une seule maison, dans le domaine, la feature ou le socle qui la possède.
  - Symptôme : modifier une notion oblige à toucher plusieurs fichiers qui n'en portent chacun qu'un morceau.
- **Duplication** : un fragment identique entre responsabilités distinctes se factorise au troisième usage réel.
- **Rangement** :
  - dès deux fichiers, une responsabilité a son sous-dossier nommé d'après elle ;
  - un fichier seul va chez son unique consommateur, sinon à la racine de son propriétaire ;
  - un dossier ou un fichier nomme une responsabilité, jamais une forme technique.
  - Symptômes : un fichier à la racine utilisé par un seul dossier ; deux fichiers jumeaux pour des fournisseurs différents rangés séparément ; un dossier `utils`, `helpers` ou `constants`.

## Vue d'ensemble

| Package / app | Rôle | Organisé par |
|---|---|---|
| `apps/backend` | Serveur NestJS + Prisma : implémente les contrats HTTP et WebSocket, porte les règles métier et la persistance. | domaine métier |
| `packages/api` | Source de vérité des contrats entre le backend et les clients : routes ts-rest, events WebSocket, schémas zod, codes d'erreur. | domaine métier |
| `packages/core` | Logique métier pure, sans I/O ni framework, partagée par le backend et les clients. | domaine métier |
| `packages/client` | Accès à l'API, état serveur et comportement headless des apps clientes ; agnostique de Next, Expo et du rendu. | feature |
| `apps/frontend` | App web joueur, Next.js (App Router) : routing, rendu, implémentation des ports plateforme. | feature |
| `apps/mobile` | App mobile joueur, Expo / React Native : routing, rendu, implémentation des ports plateforme. | feature |
| `apps/back-office` | App web d'administration du contenu, Next.js (App Router) : routing, rendu, implémentation des ports plateforme. | feature |
| `packages/design-system` | Tokens et composants UI des apps clientes. | socle technique |

| Axe | Définition | Exemples |
|---|---|---|
| domaine métier | Une notion métier avec ses règles et ses données. | `user`, `category`, `session` |
| feature | Un parcours produit, composé de domaines. | `play`, `profile`, `admin` |
| socle technique | Ce qui ne connaît aucun domaine ni feature. | protocole HTTP, persistance, ports plateforme |


## Style de code

- **Langue** : code en anglais, sauf les textes vus par l'utilisateur final, en français.
- **Commentaires** : aucun, JSDoc compris, sauf le bloc posé par le skill `deprecate` ; un *pourquoi* va dans le commit, la PR ou `docs/`.
- **Naming exact** : chaque nom dit précisément ce que la chose est ou fait, dans le vocabulaire du domaine et sans collision avec un autre domaine.
- **Annotations** : chaque `const` et `let` est annoté dès qu'un type pertinent peut être nommé, tests compris ; `satisfies` seulement pour conserver le type inféré.
- **`type` par défaut** : `interface` seulement pour un contrat à plusieurs implémentations ou une augmentation de déclaration.
- **Paramètre objet** : dès deux valeurs, un seul objet déstructuré dans la signature, typé en ligne sauf s'il est exporté ou partagé ; une signature imposée par un framework reste positionnelle.
- **Itération** : méthodes de tableau et `Promise.all`, récursion pour l'asynchrone séquentiel.

## Commits & PR

- **Commit** : une seule ligne courte, en anglais, au format Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`…), sans corps ni signature.
- **PR** : publiée en draft, titre au format `#<num_issue> - <titre_issue>`.

## Garde-fous

- Créer une nouvelle migration Prisma (`pnpm db:migrate`) plutôt que modifier une migration appliquée ou mergée.
- Laisser intacts les `overrides` de `pnpm-workspace.yaml` : la plupart corrigent des CVE.
- Demander un test manuel de l'UI plutôt que lancer le front ou le mobile.

## Maintenir ce guide

- La doc agents porte des règles réutilisables, jamais l'implémentation d'un changement : une règle n'entre que si elle s'applique à du code que le changement ne touche pas.
- Une convention modifiée met à jour, dans le même lot, ce fichier si elle est transverse, sinon le skill concerné ; jamais les deux.
- Le `README.md` racine reste à jour, dans le même lot, de tout changement de ce qu'il décrit.
