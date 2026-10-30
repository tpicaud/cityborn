# UI partagée Tamagui

- `@cityborn/design-system` possède la configuration commune et les composants partagés ; `react` et `tamagui` sont ses peer dependencies.
- Garder `tamagui` et `@tamagui/cli` sur la même version dans chaque app ; la CLI porte le compilateur et le plugin Metro.
- Le frontend charge le CSS généré et versionné pour l'export statique Next. Son build lance le compilateur Tamagui avant Turbopack.
- Le mobile compose le plugin Metro Tamagui avec NativeWind ; Expo résout React et Tamagui depuis l'app pour éviter les instances multiples.
- Les imports `react-native` des paquets `@tamagui/*` contournent la redirection NativeWind vers `react-native-css/components`, qui n'expose pas toute l'API React Native.
- Le frontend et le design system utilisent les exports web de Tamagui sans dépendance ni alias `react-native-web` ; le mobile garde sa cible Expo Web.
- Les tailles et couleurs de la configuration sont provisoires ; les tokens, thèmes et composants définitifs attendent les maquettes Figma.
