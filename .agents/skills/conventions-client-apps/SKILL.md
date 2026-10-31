---
name: conventions-client-apps
description: "Conventions des apps clientes (apps/frontend, apps/mobile, apps/back-office) et de leur design system. À utiliser pour ajouter ou modifier un écran, une page, un composant, partagé compris, le routing, le câblage de l'API ou l'implémentation d'un port plateforme."
---

# Conventions des apps clientes

## Organisation

- Le dossier de routing du framework assemble seulement : pages, layouts, providers, écrans d'erreur.
- `features/<feature>/` porte les vues d'une feature ; leur comportement vient de la feature du même nom de `@cityborn/client`, et la vue branche directement ses actions.
- Les composants UI transverses et le câblage de l'app forment le socle technique.

## Miroir frontend / mobile

- Une feature présente dans les deux apps y a le même découpage, et un composant le même nom de fichier, celui de son concept (`SignInForm.tsx`).
- Quand la plateforme rend le miroir moins bon (API native, cycle de vie, ergonomie), chaque app prend l'implémentation adaptée ; le commun reste dans `@cityborn/client` et l'écart est nommé dans la PR avec sa raison.

## Câblage

- Le socle de l'app crée le `contractClient` et l'`authApi` (cookies dans le navigateur, bearer et stockage sécurisé sur mobile) et implémente les ports plateforme de `@cityborn/client`.
- Toute page du back-office, sauf la connexion, est réservée au rôle `admin`.
- Un écran mobile qui reste monté hors focus (onglet) passe `useIsFocused()` au hook de sa feature.
- Une page du frontend ou du back-office : lire [la référence Next](references/next.md).

## Écrans

- Un écran joueur se compose dans le gabarit d'écran du design system.
- Un écran affiché sans barre d'onglets porte lui-même la zone sûre du bas.
- Adaptation d'un écran :
  - téléphone : valeurs des maquettes téléphone, sans condition de média ;
  - tablette : valeurs des maquettes tablette sous le média `md`, sur le web comme sur le mobile ;
  - desktop : sans maquette, il garde les valeurs tablette, le contenu centré dans la largeur de la maquette tablette ; fond et barre d'onglets restent pleine largeur.

## UI partagée

- Un composant destiné au frontend et au mobile vit dans `@cityborn/design-system` et utilise Tamagui.
- Un composant Tamagui, la configuration ou le build de l'UI partagée : lire [la référence Tamagui](references/tamagui.md).

## Critère de fin

- Chaque fichier ajouté vit dans le routing, sa feature ou le socle de l'app.
- Une feature présente sur le web et le mobile suit le miroir, ou son écart est nommé dans la PR.
