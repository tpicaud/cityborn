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
- Une architecture défaillante dans le périmètre touché est signalée en fin de réponse avec une piste, sans implémenter le refacto.

#### Découpage

Chaque symptôme est à corriger dans le périmètre de la tâche, sinon à signaler, en développement comme en revue.

- **Module profond** : une capacité entière derrière une surface publique courte ; ses étapes, dépendances et configuration restent privées.
  - Symptôme : l'appelant transmet un secret, un client d'infrastructure ou une option interne.
- **Surface minimale** : un symbole n'est exporté que pour un consommateur réel hors de son fichier.
  - Symptôme : un export que seul son propre module lit.
- **Raison de changer** : une nouvelle frontière isole un acteur aux règles distinctes, une dépendance d'infrastructure ou de plateforme, un cycle de vie propre, ou sert plusieurs consommateurs réels. Une étape d'un même flux reste une fonction de son module.
- **Variantes** : dès la deuxième variante, un seul module porte le comportement commun et reçoit la partie variable (port, stratégie, fonction injectée).
  - Symptômes : le même discriminant testé à plusieurs endroits ; des classes sœurs qui ne diffèrent que d'une méthode ; des factories recopiées.
- **Cohésion** : une notion a une seule maison ; un fragment dupliqué se factorise au troisième usage réel.
  - Symptôme : modifier une notion oblige à toucher plusieurs fichiers qui n'en portent chacun qu'un morceau.
- **Rangement** : dès le deuxième fichier, une capacité a son sous-dossier nommé d'après elle ; sinon un fichier va chez son unique consommateur, sinon à la racine de son propriétaire. Un dossier ou un fichier nomme une capacité, jamais une forme technique.
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

- **Commentaires** : l'intention passe par le naming, les types et le découpage. Un *pourquoi* que le code ne peut pas porter va dans le commit, la PR ou `docs/`. Seul commentaire admis : le bloc posé par le skill `deprecate`.
- **Naming exact** : chaque nom dit précisément ce que la chose est ou fait, dans le vocabulaire du domaine. Un nom générique, redondant ou en collision avec un autre domaine est renommé.
- **Fichier** : il porte le nom du concept unique qu'il contient.
- **Langue** : code, noms de tests, logs et erreurs techniques en anglais ; le français est réservé aux textes vus par l'utilisateur final.
- **Objets typés** : `const objet: Type = { … }` quand un type nommé existe ; `satisfies` seulement pour conserver le type inféré.
- **Variables locales** : chaque `const` et `let` est annoté dès qu'un type pertinent peut être nommé, données de test comprises.
- **Paramètre objet** : dès deux valeurs, une fonction les reçoit dans un seul objet déstructuré dans la signature.
  - Son type s'écrit en ligne, et devient un type nommé seulement s'il est exporté ou partagé.
  - Exception : les signatures imposées par un framework ou une bibliothèque.
- **`type` par défaut** : `interface` est réservée aux contrats à plusieurs implémentations (port, stratégie, repository, double de test) et à l'augmentation de déclarations. Une `interface` de données touchée devient un `type`.
- **Flux** : early return plutôt que `else`.
- **Itération** : méthodes de tableau et `Promise.all` ; un traitement asynchrone séquentiel passe par une fonction récursive ; aucune boucle `for`, tests compris.

## Vérifications

| Commande | Usage |
|---|---|
| `pnpm typecheck` | Typecheck du monorepo, doit toujours passer. |
| `pnpm format` / `pnpm format:check` | Lint et format Biome. |

- Vérifier d'abord de façon ciblée sur les packages modifiés.
- Lancer les contrôles transverses requis par un skill une seule fois, avant le compte rendu final.
- Relancer un contrôle réussi seulement après un changement qui le concerne.
- Tester les comportements et invariants significatifs ; un test qui recopie l'implémentation n'apporte rien.

## Commits & PR

- **Commit** : une seule ligne courte, en anglais, au format Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`…), sans corps ni signature.
- **PR** : publiée en draft, titre au format `#<num_issue> - <titre_issue>`.

## Garde-fous

- Demander avant d'ajouter une dépendance npm.
- Créer une nouvelle migration Prisma (`pnpm db:migrate`) plutôt que modifier une migration appliquée ou mergée.
- Laisser intacts les `overrides` de `pnpm-workspace.yaml` : la plupart corrigent des CVE.
- Demander un test manuel de l'UI plutôt que lancer le front ou le mobile.

## Maintenir ce guide

- Une convention modifiée met à jour, dans le même lot, ce fichier si elle est transverse, sinon le skill concerné ; jamais les deux.
- Le `README.md` racine suit, dans le même lot, tout changement du démarrage local, de ses prérequis, des variables d'environnement, des ports, des commandes `dev:web` / `dev:mobile` ou de l'arborescence qu'il présente.
