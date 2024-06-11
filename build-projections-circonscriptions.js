#!/usr/bin/env node
import {readFile, mkdir} from 'node:fs/promises'
import {toPairs, sumBy, sortBy} from 'lodash-es'
import yaml from 'js-yaml'
import {readJsonFile, writeJsonFile} from './lib/json.js'
import {prepareCirconscriptionsHelper} from './lib/circonscriptions.js'

await mkdir('dist', {recursive: true})

const mappingFile = await readFile('report-de-votes.yaml', 'utf8')
const mapping = yaml.load(mappingFile)

const circonscriptionsHelper = await prepareCirconscriptionsHelper()
const resultatsEur2024 = await readJsonFile('dist/resultats-eu2024.json')
const resultatsCirconscriptions = new Map()

for (const commune of resultatsEur2024) {
  const circonscriptions = circonscriptionsHelper.getCirconscriptions(commune.codeCommune)

  if (!circonscriptions) {
    console.log(`pas de circonscription trouvée pour la commune ${commune.codeCommune}`)
    continue
  }

  const ratio = 1 / circonscriptions.length

  for (const circonscription of circonscriptions) {
    if (!resultatsCirconscriptions.has(circonscription.codeCirconscription)) {
      resultatsCirconscriptions.set(circonscription.codeCirconscription, [])
    }

    for (const resultat of commune.resultats) {
      const mappingListe = mapping[resultat.nomListe]

      if (!mappingListe) {
        console.log(`pas de mapping trouvé pour la liste ${resultat.nomListe}`)
        continue
      }

      for (const [listeReport, ratioReport] of Object.entries(mappingListe)) {
        if (!resultatsCirconscriptions.get(circonscription.codeCirconscription)[listeReport]) {
          resultatsCirconscriptions.get(circonscription.codeCirconscription)[listeReport] = 0
        }

        resultatsCirconscriptions.get(circonscription.codeCirconscription)[listeReport] += resultat.nbVoix * ratio * (ratioReport / 100)
      }
    }
  }
}

const output = []

for (const [codeCirconscription, resultats] of resultatsCirconscriptions.entries()) {
  const preparedResultats = sortBy(toPairs(resultats), ([, nbVoix]) => -nbVoix).map(([nomListe, nbVoix]) => ({nomListe, nbVoix}))

  console.log(`circonscription ${codeCirconscription}: ${preparedResultats[0].nomListe} avec ${preparedResultats[0].nbVoix.toFixed(0)} voix`)

  const votesExprimes = sumBy(preparedResultats, 'nbVoix')

  const entry = {
    codeCirconscription,
    votesExprimes,
    resultats: preparedResultats.map(r => ({...r, pourcentage: r.nbVoix / votesExprimes * 100}))
  }

  output.push(entry)
}

await writeJsonFile('dist/projection-circonscriptions-lg2024.json', output)
