# Législatives 2024

Projection théorique des résultats des élections européennes 2024 sur les circonscriptions législatives, en vue des élections législatives anticipées du 30 juin 2024.

Cette démarche est bien évidemment théorique et fait les hypothèses suivantes :
- La participation est inchangée
- Les logiques locales ne sont pas prises en compte
- Il n'y a pas de prime au sortant
- Il n'y a pas de candidatures dissidentes
- Les votes des communes sur plusieurs circonscriptions sont répartis équitablement sur ces circonscriptions (en attendant des données au bureau de vote du Ministère)
- Les reports de votes sont configurés dans un fichier (voir la suite de la documentation)
- Pas de prise en compte des circonscriptions des Français établis à l'étranger et d'outre-mer (cela est prévu mais cela demande du travail supplémentaire étant donné qu'il y a une divergence de codification entre l'INSEE et le Ministère de l'Intérieur)

## Données utilisées

- [Résultats des élections européennes 2022](https://www.resultats-elections.interieur.gouv.fr/telechargements/EU2024) - Ministère de l'Intérieur
- [Découpage administratif](https://github.com/etalab/decoupage-administratif) - Etalab
- [Table de correspondance entre les communes et les circonscriptions législatives](https://www.insee.fr/fr/statistiques/6436476?sommaire=6436478) - INSEE


## Pré-requis

- Node.js 20+

## Utilisation

Tout d'abord on installe les paquets JavaScript requis au fonctionnement de ce projet.

```bash
npm install
```

Ensuite on prépare les données des élections européennes (téléchargement, extraction XML etc.).

```bash
node build-resultats-eu2024.js
```

On configure ses projections de reports de votes en copiant le fichier exemple, puis en l'adaptant.

```bash
cp report-de-votes.yaml.sample report-de-votes.yaml
```

On exécute le script qui va produire le fichier `dist/projection-circonscriptions-lg2024.json`.

```bash
node build-projections-circonscriptions.js
```

## Fichiers produits

- `dist/projections-circonscriptions-lg2024.json` - [exemple avec le fichier de report de votes fourni](dist-example/projection-circonscriptions-lg2024.json)
- `dist/projections-circonscriptions-lg2024.csv` - [exemple avec le fichier de report de votes fourni](dist-example/projection-circonscriptions-lg2024.csv)

## Licence

MIT
