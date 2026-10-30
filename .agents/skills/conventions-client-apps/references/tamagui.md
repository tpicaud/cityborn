# UI partagée Tamagui

- Le projet suit Tamagui 3, dont la syntaxe et les noms de tokens diffèrent de Tamagui 1 et 2 : avant d'écrire du Tamagui, lire `.tamagui/prompt.md` d'une app, généré par `tamagui build`, pour les tokens, thèmes, raccourcis et la grammaire des valeurs.
- Déclarer `react` et `tamagui` comme peer dependencies du design system et garder une seule version de `tamagui` et des paquets `@tamagui/*` dans le monorepo.
- Construire la configuration commune à partir de `@tamagui/config/v6` et de la palette du design system.
- Un composant partagé se style par les thèmes, variantes et tokens de la configuration, sans couleur ni dimension brute.
- Après un changement de configuration ou de composant partagé, régénérer et commiter le CSS Tamagui du frontend.
- Le frontend et le design system utilisent les exports web de Tamagui sans alias `react-native-web`.
- Terminé quand `tamagui check --strict` passe et que le rendu n'émet aucun warning `[tamagui]` dans la console de l'app.
