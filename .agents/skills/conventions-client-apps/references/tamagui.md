# UI partagée Tamagui

- Le projet suit Tamagui 3, dont la syntaxe et les noms de tokens diffèrent de Tamagui 1 et 2 : avant d'écrire du Tamagui, lire `.tamagui/prompt.md` d'une app, généré par `tamagui build`, pour les tokens, thèmes, raccourcis et la grammaire des valeurs.
- `react` et `tamagui` sont des peer dependencies du design system.
- `tamagui` et les paquets `@tamagui/*` partagent une seule version dans le monorepo.
- La configuration commune part de `@tamagui/config/v6` et de la palette du design system.
- Un composant partagé se style par les thèmes, variantes et tokens de la configuration, sans couleur ni dimension brute.
- Seule exception : une mesure relevée telle quelle sur la maquette (boîte d'un asset, largeur d'une maquette) s'écrit en pixels, dans une constante nommée du composant qui la lit.
- Une police de la configuration porte une échelle de tailles chiffrée, plus les tailles `xs`…`9xl` que lit le sizing des composants Tamagui.
- Un style de texte des maquettes (titre, CTA, légende) devient un composant `styled` du design system qui pointe une taille de l'échelle.
- Un asset partagé (logo, fond, icône) s'exporte du Figma dans les `assets/` du design system ; l'app l'importe par le sous-chemin `@cityborn/design-system/assets/`.
- Un composant du design system qui affiche un asset reçoit son composant d'image de l'app par un contexte du design system, car un import d'image n'a pas le même type sous Next et Metro.
- L'image fournie remplit la boîte que lui donne le composant, proportions conservées : le composant dimensionne cette boîte.
- Chaque app fournit ce contexte avec son composant d'image (`next/image`, `expo-image`), au-dessus de `TamaguiProvider`, dont le portail natif rend hors de l'arbre de ses enfants.
- Une police partagée vit dans `assets/fonts/` du design system avec sa licence : un `.woff2` pour le web et un `.ttf` pour le natif par graisse utilisée.
- Le web charge la police par `next/font/local` et l'expose dans une variable CSS, que lit la famille web de la configuration ; le mobile la charge par `useFonts`, chaque face native nommée comme son fichier.
- Le CSS Tamagui versionné du frontend reflète la configuration : après un changement de configuration, il se régénère avec `tamagui build --target web ./src` lancé seul, car le build de l'app restaure la version versionnée.
- Le frontend et le design system utilisent les exports web de Tamagui sans alias `react-native-web`.
- Terminé quand `tamagui check --strict` passe et que le test manuel demandé couvre l'absence de warning `[tamagui]` dans la console.
