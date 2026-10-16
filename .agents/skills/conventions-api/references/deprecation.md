# Marqueur de dépréciation

`pnpm --dir packages/api check:deprecations` lit ce marqueur au caractère près.

```ts
/**
 * @deprecated Utiliser `finalizeGame` à la place. Conservé pour les
 * builds mobile publiées avant ce renommage.
 * @deprecatedSince <YYYY-MM-DD>
 */
endSoloGame: { method: 'POST', ... },
```

- `@deprecated` et `@deprecatedSince` vont toujours ensemble : un `@deprecated` seul n'est jamais proposé au nettoyage.
- `@deprecatedSince` porte la date du jour.
- Le bloc est collé au-dessus de la déclaration, propriété ou membre déprécié.
- L'élément déprécié reste pleinement fonctionnel.

## Critère de fin

`pnpm --dir packages/api check:deprecations` liste le symbole avec son nom et sa raison, au statut ❓ tant qu'il n'est pas déployé.
