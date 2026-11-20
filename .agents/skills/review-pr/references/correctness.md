# Axe Correction

Le code satisfait-il l'issue, sans bug ni faille ? Appliquer [le déroulé d'un axe](axis.md) avec cette checklist. Le style relève de l'axe Conventions, sauf s'il masque un bug. Un correctif proposé supprime ou restreint plutôt qu'il n'ajoute.

## Checklist

- **Spec** : chaque critère d'acceptation satisfait, chaque exigence implémentée telle que l'issue la décrit, rien d'ajouté hors de l'issue.
- **Bugs** : logique, cas limites, erreurs propagées, concurrence, états partiels, appelants cassés hors du diff ; suivre le chemin de chaque critère jusque dans le code non modifié.
- **Sécurité** : authentification et autorisation de chaque route ou event touché, validation zod des entrées, secrets absents du code, des logs et des réponses, données exposées au strict nécessaire, injections.

## Preuves

Ajouter au rapport une ligne par critère d'acceptation :

- `prouvé` : le test (`chemin:ligne`) ou la commande qui exerce réellement ce critère ;
- `à vérifier en recette` : un critère qui ne se prouve qu'app lancée ou sur un appareil (rendu, redirection perçue, compte tiers), marqué « (vérification manuelle) » ou non ;
- sinon l'ID du finding `bloquant` qui le signale.

Terminé quand chaque critère a sa ligne.
