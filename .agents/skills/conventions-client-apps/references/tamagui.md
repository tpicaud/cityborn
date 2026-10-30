# UI partagée Tamagui

- Le projet suit Tamagui 3, dont la syntaxe et les noms de tokens diffèrent de Tamagui 1 et 2 : avant d'écrire du Tamagui, lire `.tamagui/prompt.md` d'une app, généré par `tamagui build`, pour les tokens, thèmes, raccourcis et la grammaire des valeurs.
- `react` et `tamagui` sont des peer dependencies du design system.
- `tamagui` et les paquets `@tamagui/*` partagent une seule version dans le monorepo.
- La configuration commune part de `@tamagui/config/v6` et de la palette du design system.
- Un composant partagé se style par les thèmes, variantes et tokens de la configuration, sans couleur ni dimension brute.
- Le CSS Tamagui versionné du frontend reflète la configuration : après un changement de configuration, il se régénère avec `tamagui build --target web ./src` lancé seul, car le build de l'app restaure la version versionnée.
- Le frontend et le design system utilisent les exports web de Tamagui sans alias `react-native-web`.
- Terminé quand `tamagui check --strict` passe et que le test manuel demandé couvre l'absence de warning `[tamagui]` dans la console.
