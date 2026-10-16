# Apps Next : export statique

Le frontend et le back-office sont exportés en statique (`output: 'export'`), sans code serveur Next.

- Chaque page charge ses données dans le navigateur.
- Un paramètre de requête se lit avec `useSearchParams()` sous une `Suspense`.
- Une URL à identifiant sert une page sans segment dynamique :
  - la réécriture est déclarée dans `next.config.ts` et `vercel.json` ;
  - la page lit l'identifiant avec `usePathname()` et le parseur colocalisé avec le constructeur du chemin.
