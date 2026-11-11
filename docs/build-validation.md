# Validation des builds clients

Les builds web valident les sources originales et les packages partagés avant le bundling.
Le frontend conserve ensuite la vérification TypeScript de Next sur les sources compilées par Tamagui.
Les options strictes et la détection des imports inutilisés restent actives.
Le graphe de typecheck Turbo propage les changements des packages partagés aux caches de leurs consommateurs.

Les scripts natifs `prebuild`, `android`, `ios` et `build-android:local` passent par la même validation mobile.
Le hook `eas-build-post-install` l'impose aussi aux builds EAS locaux et distants, Android comme iOS.
Les workflows natifs exécutent cette validation avant les opérations Expo et EAS.
La compilation Tamagui mobile reste désactivée pour le problème distinct des safe areas.

## Correctifs des dépendances

Les patches pnpm ciblent Next 16.4.1 et Tamagui CLI 3.1.6, sans modifier les overrides de sécurité.
Ils s'appliquent à l'installation avec le lockfile versionné.

- Next conditionne les imports des validateurs aux routes TypeScript effectivement validées.
  Les seules métadonnées et les routes JavaScript ne produisent plus d'imports inutilisés.
  Le correctif couvre les générateurs strict et standard, en CommonJS et ESM.
- Tamagui retire uniquement les bindings d'import utilisés avant compilation et devenus inutilisés après aplatissement.
  L'analyse TypeScript conserve les références JSX et de type, les imports initialement inutilisés et les effets de bord.
  La CLI conserve son cycle de sauvegarde et de restauration des sources et du CSS.

Le problème Next est suivi dans [vercel/next.js#99919](https://github.com/vercel/next.js/issues/99919).
La CLI reste l'intégration recommandée pour [Next avec Turbopack dans Tamagui 3](https://tamagui.dev/docs/intro/compiler-install).
À la montée de version, vérifier ces régressions avant de retirer chaque patch ; les versions 16.4.6 et 3.3.2 consultées conservent ces défauts.
Le nettoyage des imports de la CLI est une piste de contribution au [dépôt Tamagui](https://github.com/tamagui/tamagui).

## Régressions

- `pnpm check:build-patches` : métadonnées, routes JavaScript et TypeScript, alias, JSX, types, shadowing et effets de bord.
- `pnpm check:frontend-build` : build froid, visite de `/profile` sous `next dev`, typechecks et deux builds consécutifs.
  Le contrôle relie les classes des vues aplaties aux règles CSS chargées par l'export HTML.
  Des imports inutilisés, erreurs de type et contrats de layout invalides doivent bloquer typecheck et build direct.
  Les sources et le CSS sont comparés après succès et après échec de la commande exécutée par Tamagui.
- `pnpm check:mobile-build` : les entrées de build natif rejettent un import mobile inutilisé.
  Une erreur dans un package partagé bloque les builds web et le hook EAS.
  Après préchauffage du cache, un contrat partagé valide mais incompatible avec le mobile doit aussi bloquer le hook EAS.

Le contrôle frontend supprime les sorties locales `.next/` et `out/` pour partir à froid.
Il utilise la configuration publique habituelle du frontend ; les valeurs factices du workflow suffisent.
Les probes sont temporaires et restaurés en fin de contrôle.
Les vérifications sont intégrées au workflow PR existant, activé lorsque la PR sort du draft.
