---
name: deprecate
description: "Dépréciation du contrat @cityborn/api. À utiliser quand l'utilisateur demande de déprécier un élément public : route, champ, type ou valeur d'enum."
---

# Déprécier un élément du contrat API

## Périmètre

Appliquer ce mécanisme uniquement à la surface publique de `@cityborn/api` dans `packages/api/src/**/*.ts`, hors tests : routes ts-rest, champs zod, valeurs d'enum et types ou constantes exportés.

## Principe : additif, jamais destructif

Déprécier ajoute un marqueur tout en conservant l'élément pleinement fonctionnel et rétrocompatible. Un remplaçant demandé est créé à côté de l'ancien. La suppression relève du skill `check-and-remove-deprecated` après la fenêtre définie dans `packages/api/openapi/compat-policy.json`.

## Convention exacte (parsée par un script, à respecter au caractère près)

```ts
/**
 * @deprecated Utiliser `finalizeGame` à la place. Conservé pour les
 * builds mobile publiées avant ce renommage.
 * @deprecatedSince <YYYY-MM-DD-du-jour>
 */
```

- Les deux tags sont **obligatoires ensemble**. Un `@deprecated` seul (sans `@deprecatedSince`) n'est jamais détecté par `check:deprecations` et ne sera donc jamais proposé au nettoyage — à éviter.
- `@deprecatedSince <YYYY-MM-DD>` : toujours la **date du jour**, jamais une version ni une date devinée.
- Le bloc JSDoc doit être **collé directement au-dessus de la déclaration**, sans rien entre les deux — le script lit la première ligne non vide après le commentaire pour en extraire le nom du symbole.

Exemples de placement selon le type d'élément :

```ts
// Route ts-rest (propriété d'objet)
/** @deprecated ... @deprecatedSince <YYYY-MM-DD-du-jour> */
endSoloGame: { method: 'POST', ... },

// Champ de schéma zod (propriété d'objet)
export const gameSchema = z.object({
  /** @deprecated ... @deprecatedSince <YYYY-MM-DD-du-jour> */
  oldField: z.string(),
});

// Valeur d'enum (membre)
enum ErrorCode {
  /** @deprecated ... @deprecatedSince <YYYY-MM-DD-du-jour> */
  OLD_CODE = 'OLD_CODE',
}

// Type exporté (déclaration)
/** @deprecated ... @deprecatedSince <YYYY-MM-DD-du-jour> */
export type OldShape = { ... };
```

## Étapes

1. Identifier précisément l'élément à déprécier et, s'il existe ou fait partie de la demande, son remplaçant.
2. Ajouter le bloc JSDoc directement au-dessus de la déclaration, avec la date du jour.
3. Vérifier que le marqueur est bien capté : `pnpm --dir packages/api check:deprecations` doit lister le symbole avec le bon nom et la bonne raison (statut ❓ attendu juste après l'ajout, tant que ce n'est pas encore déployé).
4. Lancer `pnpm typecheck` et `pnpm check:api-compat` — l'ajout d'un JSDoc seul ne doit jamais les casser. Si ça casse, un autre changement s'est glissé en même temps : le séparer.
5. Présenter le diff.
