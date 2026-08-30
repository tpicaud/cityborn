---
name: deprecate
description: Marque un élément du contrat API (@cityborn/api — route ts-rest, champ de schéma zod, valeur d'enum, type exporté). À utiliser quand l'utilisateur autorise/demande de déprécier une route, un type, un champ ou une valeur d'enum du contrat API.
---

# Déprécier un élément du contrat API

## Périmètre

Uniquement pour la surface publique de `@cityborn/api` (`packages/api/src/**/*.ts`, hors `*.test.ts`) : routes de contrat ts-rest, champs de schéma zod, valeurs d'enum, types/constantes exportés. Ce mécanisme n'existe pas ailleurs dans le monorepo — ne pas l'utiliser pour du code interne à `apps/*`.

## Principe : additif, jamais destructif

Déprécier = ajouter un marqueur, **rien d'autre**. L'élément reste pleinement fonctionnel et rétrocompatible — c'est un garde-fou du projet (`check:api-compat` en CI). Si un remplaçant n'existe pas encore, le créer à côté sans toucher à l'ancien. Ne jamais supprimer l'élément dans la même action : la suppression est gérée séparément par le skill `check-and-remove-deprecated`, une fois la fenêtre de compatibilité (`min_days_supported`/`min_num_of_version_supported` dans `packages/api/openapi/compat-policy.json`) passée.

## Convention exacte (parsée par un script, à respecter au caractère près)

```ts
/**
 * @deprecated Utiliser `finalizeGame` à la place. Conservé pour les
 * builds mobile publiées avant ce renommage.
 * @deprecatedSince 2026-08-21
 */
```

- Les deux tags sont **obligatoires ensemble**. Un `@deprecated` seul (sans `@deprecatedSince`) n'est jamais détecté par `check:deprecations` et ne sera donc jamais proposé au nettoyage — à éviter.
- `@deprecatedSince <YYYY-MM-DD>` : toujours la **date du jour**, jamais une version ni une date devinée.
- Le bloc JSDoc doit être **collé directement au-dessus de la déclaration**, sans rien entre les deux — le script lit la première ligne non vide après le commentaire pour en extraire le nom du symbole.

Exemples de placement selon le type d'élément :

```ts
// Route ts-rest (propriété d'objet)
/** @deprecated ... @deprecatedSince 2026-08-25 */
endSoloGame: { method: 'POST', ... },

// Champ de schéma zod (propriété d'objet)
export const gameSchema = z.object({
  /** @deprecated ... @deprecatedSince 2026-08-25 */
  oldField: z.string(),
});

// Valeur d'enum (membre)
enum ErrorCode {
  /** @deprecated ... @deprecatedSince 2026-08-25 */
  OLD_CODE = 'OLD_CODE',
}

// Type exporté (déclaration)
/** @deprecated ... @deprecatedSince 2026-08-25 */
export type OldShape = { ... };
```

## Étapes

1. Identifier précisément l'élément à déprécier et son remplaçant. Si le remplaçant n'existe pas, le créer d'abord (ou demander à l'utilisateur avant toute modification cassante du contrat — garde-fou AGENTS.md).
2. Ajouter le bloc JSDoc directement au-dessus de la déclaration, avec la date du jour.
3. Vérifier que le marqueur est bien capté : `pnpm --dir packages/api check:deprecations` doit lister le symbole avec le bon nom et la bonne raison (statut ❓ attendu juste après l'ajout, tant que ce n'est pas encore déployé).
4. Lancer `pnpm typecheck` et `pnpm check:api-compat` — l'ajout d'un JSDoc seul ne doit jamais les casser. Si ça casse, un autre changement s'est glissé en même temps : le séparer.
5. Présenter le diff. Ne jamais commit (garde-fou projet).
