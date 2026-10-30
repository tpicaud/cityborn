# UI partagée Tamagui

- Le projet suit Tamagui 3, dont la syntaxe et les noms de tokens diffèrent de Tamagui 1 et 2 : avant d'écrire du Tamagui, lire `.tamagui/prompt.md` d'une app, généré par `tamagui build`, pour les tokens, thèmes, raccourcis et la grammaire des valeurs.
- `@cityborn/design-system` possède la configuration commune et les composants partagés ; `react` et `tamagui` sont ses peer dependencies, `@tamagui/config` sa dépendance.
- Tous les paquets `tamagui` et `@tamagui/*` partagent une seule version dans le monorepo ; la CLI porte le compilateur et le plugin Metro.
- La configuration part de la config v6 de `@tamagui/config` ; sa palette `brand` vient des couleurs du design system.
- Un composant partagé se style par les thèmes, variantes et tokens de la configuration, sans couleur ni dimension brute.
- Le frontend charge le CSS généré et versionné pour l'export statique Next. Son build lance le compilateur Tamagui avant Turbopack puis restaure la version versionnée : après un changement de configuration, régénérer ce CSS avec `tamagui build --target web ./src` et le commiter.
- Le mobile compose le plugin Metro Tamagui avec NativeWind ; Expo résout React et Tamagui depuis l'app pour éviter les instances multiples.
- Les imports `react-native` des paquets `@tamagui/*` contournent la redirection NativeWind vers `react-native-css/components`, qui n'expose pas toute l'API React Native.
- Le frontend et le design system utilisent les exports web de Tamagui sans dépendance ni alias `react-native-web` ; le mobile garde sa cible Expo Web.
- Terminé quand `tamagui check --strict` passe et que le rendu n'émet aucun warning `[tamagui]` dans la console de l'app.
