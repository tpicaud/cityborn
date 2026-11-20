# Suivre les maquettes

Un écart est une différence entre le rendu web et la maquette. N'en sont pas :

- ce que l'issue retire ou change par rapport à la maquette ;
- un contenu venu des données : libellé, image ou icône fournis par l'API, nombre d'éléments.

## Lire

- Pour chaque nœud Figma lié, lire son contexte de design : dimensions du cadre, tokens, assets et textes ; son image n'est que la cible visuelle.
- Quand le contexte d'un écran entier est tronqué, lire sa structure puis le contexte de chaque bloc visible.
- La taille du cadre fixe le viewport de comparaison : téléphone ou tablette.

## Comparer

Avant de livrer, pour chaque écran à maquette :

1. L'ouvrir sur le web dans l'environnement de recette isolé, préparé selon le skill `execute-ui-scenarios`, avec des données proches de la maquette.
2. Le capturer au viewport de chaque maquette, hors du checkout.
3. Mesurer chaque bloc que l'issue modifie (position, taille, styles calculés) et le confronter au contexte de design : éléments et leur ordre, dimensions, espacements, couleurs, typographie, textes, assets.
4. Corriger chaque écart, puis recapturer.

Arrêter ensuite les ressources lancées selon le même skill.

Terminé quand chaque écran à maquette, à chaque viewport, n'a plus que des écarts volontaires, ou figure parmi les écrans non comparés.

## Rapporter

- Un écart volontaire va dans « Décisions prises ».
- Un écart remarqué sur un autre bloc va dans « Pistes ».
- Le compte rendu final liste, par écran et viewport, les écarts corrigés et les écarts volontaires.
- Le rendu mobile se vérifie en recette manuelle : le parcours `Mobile` de l'écran attend la conformité à la maquette.
- Sans accès aux maquettes ou au navigateur, le compte rendu final nomme l'accès manquant et chaque écran non comparé.
