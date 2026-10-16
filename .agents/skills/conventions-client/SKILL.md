---
name: conventions-client
description: "Conventions de packages/client (@cityborn/client). À utiliser pour ajouter ou modifier une feature, un hook, un accès API, une query, un port plateforme ou la surface publique du package."
---

# Conventions `@cityborn/client`

## Organisation

- `domains/<domaine>/` porte l'accès à un domaine du contrat, sous le même nom que dans `@cityborn/api` :
  - `<domaine>Api.ts` : le port et sa factory, seul fichier qui appelle le contrat de ce domaine ;
  - `<domaine>Queries.ts` : les clés, les `queryOptions` et les mises à jour du cache.
- `features/<feature>/` porte le comportement d'une feature des apps : hooks, formulaires, transformations pures, contrats de vue. Une feature compose des domaines.
- Le socle technique porte le transport HTTP, le transport WebSocket, les ports plateforme et les providers transverses.
- La connexion WebSocket appartient au socle : une feature fournit seulement sa restauration, rejouée à chaque connexion.

## Surface publique

- L'`exports` map est la surface publique : une entrée par feature et par module du socle consommé par les apps ; un domaine n'en a pas.
- Chaque `index.ts` liste ses exports un à un, sans `export *` : ce qu'une app importe, plus les options et le retour de chaque hook exporté.
- Chaque symbole exporté appartient à une famille :

| Famille | Contrat |
|---|---|
| Comportement | `use<Nom>(options: <Nom>Options): <Nom>` ; le retour est un objet nommé ; hook, options et retour sont exportés ensemble |
| Formulaire | `use<Nom>Form(): <Nom>Form`, valeurs `<Nom>FormInput` / `<Nom>FormValues` ; une soumission se type par `FormSubmitHandler` |
| Transformation pure | nommée par son résultat : `create<Nom>`, `format<Nom>`, prédicat ou sélecteur |
| Contrat de vue | `<Composant>Props` |
| Branchement | `<Domaine>Api`, `create<Domaine>Api`, `<Domaine>Provider`, quand l'app les branche elle-même |

- Quand `<Nom>` désigne déjà un DTO de `@cityborn/api` ou un composant d'app, le hook prend un nom plus précis (`useSignInFlow`).
- Un fichier regroupe les hooks d'un même flux et porte le nom du flux (`signIn.ts`) ; un hook seul vit dans `use<Comportement>.ts` ; une transformation pure, dans un fichier au nom de son résultat.

## État serveur

- Un hook lit les ports par `useDomainApis()`, jamais en paramètre, et ses données par les `queryOptions` du domaine.
- Chaque query fixe `staleTime`, `retry` et `meta.reportsError`.
- Une donnée propre au compte connecté a une clé sous `accountQueryKey(userId)`.
- Une écriture appelle directement le port, puis met à jour le cache par les queries du domaine ; react-hook-form porte l'état de soumission.
- Le hook d'un écran qui peut rester monté hors focus reçoit ce focus et le transmet à l'option `subscribed` de sa query.
- Une erreur ou un formulaire : lire [la référence erreurs](references/errors.md).

## Ports plateforme

- Le package ignore Next, Expo, React Native et le rendu : un besoin plateforme devient un port typé du socle, implémenté et injecté par chaque app.
- Un chemin ajouté à `NavigationPath` existe dans chaque app qui y navigue : aucun outil ne le vérifie.

## Critère de fin

- Chaque fichier ajouté vit dans sa feature, son domaine ou le socle.
- Chaque `index.ts` touché suit la surface publique.
- Chaque nouvelle feature exposée a son entrée dans l'`exports` map.
