# Marqueur de dépréciation

`pnpm --dir packages/api check:deprecations` lit ce marqueur au caractère près.

```ts
/**
 * @deprecated Utiliser `finalizeGame` à la place. Conservé pour les
 * builds mobile publiées avant ce renommage.
 * @deprecatedSince <YYYY-MM-DD>
 */
endSoloGame: { method: 'POST', deprecated: true, ... },
```

Les routes HTTP et les events WebSocket suivent le même mécanisme :

```ts
/**
 * @deprecated Utiliser `newEvent` à la place. Conservé pour les builds mobile publiées.
 * @deprecatedSince <YYYY-MM-DD>
 */
oldEvent: { payload: EventPayloadSchema, deprecated: true },
```

- `@deprecated` et `@deprecatedSince` vont toujours ensemble : un `@deprecated` seul n'est jamais proposé au nettoyage.
- Pour une route HTTP ou un event WebSocket, ajouter aussi explicitement `deprecated: true` à sa définition.
- Les commentaires alimentent le suivi d'éligibilité au nettoyage ; la propriété `deprecated` alimente OpenAPI et oasdiff, sans liaison automatique entre les deux.
- `@deprecatedSince` porte la date du jour.
- Le bloc est collé au-dessus de la déclaration, propriété ou membre déprécié.
- L'élément déprécié reste pleinement fonctionnel.

## Critère de fin

- `pnpm --dir packages/api check:deprecations` liste le symbole avec son nom et sa raison, au statut ❓ tant qu'il n'est pas déployé.
- Pour une route HTTP ou un event WebSocket, l'opération OpenAPI générée porte aussi `deprecated: true`.
