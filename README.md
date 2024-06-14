# Législatives 2024

API permettant de récupérer les résultats des élections européennes 2024 en faisant varier le périmètre, le niveau d'agrégation et le format de sortie.

Elle permet aussi d'effecter des projections sur la base d'un mécanisme de report de voix configurable à la volée.

## Données utilisées

- [Résultats des élections européennes 2022](https://www.data.gouv.fr/fr/datasets/resultats-des-elections-europeennes-du-9-juin-2024/) - Ministère de l'Intérieur et des Outre-Mer

## Pré-requis

- Node.js 20+

## Utilisation

Tout d'abord on installe les paquets JavaScript requis au fonctionnement de ce projet.

```bash
npm install
```

Ensuite on prépare les données nécessaires au fonctionnement

```bash
npm run build
```

Puis on lance le service de l'API

```bash
npm run start
```

## Documentation de l'API

### Points d'entrée

`GET /circonscriptions` :clipboard: => résultats agrégés ou projection pour toutes les circonscriptions

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/circonscriptions

`GET /circonscriptions/:codeCirconscription` => résultats agrégés pour la circonscription

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/circonscriptions/0101

`GET /circonscriptions/:codeCirconscription/bureaux-de-vote` :clipboard: => résultats des bureaux de vote de la circonscription

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/circonscriptions/0101/bureaux-de-vote

`GET /departements/:codeDepartement` => résultats agrégés pour le département

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/departements/01

`GET /departements/:codeDepartement/bureaux-de-vote` :clipboard: => résultats des bureaux de vote du département

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/departements/01/bureaux-de-vote

`GET /communes/:codeCommune` => résultats agrégés pour la commune

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/communes/01001

`GET /communes/:codeCommune/bureaux-de-vote` :clipboard: => résultats des bureaux de vote de la commune

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/communes/01001/bureaux-de-vote

`GET /communes/:codeCommune/bureaux-de-vote/:numeroBureauDeVote` => résultats du bureau de vote

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/communes/01001/bureaux-de-vote/1

### Projection

Il est possible pour tous les points d'entrée de définir une matrice de report de voix sur des listes fictives. Vous pouvez ainsi imaginer des scénarios sur mesure.

Voici la forme attendue pour la matrice : https://gist.github.com/jdesboeufs/a2acef52dc0ac4bb7fbe76134270ed4b (cette matrice est un exemple).

Pour activer la fonctionnalité il faut exécuter les appels à l'API en mode POST avec la matrice en contenu OU héberger la matrice sur Gist et indiquer l'URL dans un paramètre `projectionUrl`.

Exemple d'appel : https://legislatives-2024-livingdata-a42c348e.koyeb.app/circonscriptions?projectionUrl=https://gist.githubusercontent.com/jdesboeufs/a2acef52dc0ac4bb7fbe76134270ed4b/raw/770a2d8b4c792e2a7939ee2d75b70ddadb9b0061/reports-de-voix.json

### Formats

Par défaut tous les points d'entrée retourne des données au format JSON.
Pour les points d'entrés indiqués avec le pictogramme :clipboard: il est possible d'obtenir les résultats au format CSV (séparateur point-virgule).

Exemple : https://legislatives-2024-livingdata-a42c348e.koyeb.app/circonscriptions?format=csv

### Fair use

L'API est hébergée gracieusement. Il se peut qu'elle ne puisse pas répondre à de trop fortes sollicitations. En cas de besoin ou de problèmes contactez-moi via une issue ou sur [X](https://x.com/jdesboeufs).

## Licence

Code sous licence MIT
Données sous Licence Ouverte 2.0
