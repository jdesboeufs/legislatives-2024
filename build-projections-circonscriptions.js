#!/usr/bin/env node
import {readFile, mkdir} from 'node:fs/promises'
import {chain, countBy} from 'lodash-es'
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
      resultatsCirconscriptions.set(circonscription.codeCirconscription, {
        inscrits: 0,
        votants: 0,
        blancs: 0,
        abstentions: 0,
        nuls: 0,
        exprimes: 0,
        voix: {}
      })
    }

    const circonscriptionEntry = resultatsCirconscriptions.get(circonscription.codeCirconscription)

    circonscriptionEntry.inscrits += commune.inscrits * ratio
    circonscriptionEntry.votants += commune.votants * ratio
    circonscriptionEntry.blancs += commune.blancs * ratio
    circonscriptionEntry.abstentions += commune.abstentions * ratio
    circonscriptionEntry.nuls += commune.nuls * ratio
    circonscriptionEntry.exprimes += commune.exprimes * ratio

    for (const resultat of commune.resultats) {
      const mappingListe = mapping[resultat.nomListe]

      if (!mappingListe) {
        console.log(`pas de mapping trouvé pour la liste ${resultat.nomListe}`)
        continue
      }

      for (const [listeReport, ratioReport] of Object.entries(mappingListe)) {
        circonscriptionEntry.voix[listeReport] ||= 0
        circonscriptionEntry.voix[listeReport] += resultat.nbVoix * ratio * (ratioReport / 100)
      }
    }
  }
}

const output = []

for (const [codeCirconscription, circonscription] of resultatsCirconscriptions.entries()) {
  const {exprimes, abstentions, inscrits} = circonscription

  const preparedResultats = chain(circonscription.voix)
    .toPairs()
    .sortBy(([, nbVoix]) => -nbVoix)
    .map(([nomListe, nbVoix]) => ({nomListe, nbVoix, pourcentage: nbVoix / exprimes * 100}))
    .value()

  let ecartPremierDeuxieme = null

  if (preparedResultats.length > 1) {
    ecartPremierDeuxieme = preparedResultats[0].pourcentage - preparedResultats[1].pourcentage
  }

  if (ecartPremierDeuxieme < 10) {
    console.log(`circonscription ${codeCirconscription} : écart faible (${ecartPremierDeuxieme.toFixed(2)} points) - Liste en tête : ${preparedResultats[0].nomListe}`)
  }

  const entry = {
    codeCirconscription,
    inscrits,
    votesExprimes: exprimes,
    abstentions,
    tauxAbstention: abstentions / inscrits * 100,
    listeEnTete: preparedResultats[0].nomListe,
    ecartPremierDeuxieme,
    resultats: preparedResultats
  }

  output.push(entry)
}

console.log('Projection des blocs politiques en tête :')
console.log(countBy(output, circonscription => circonscription.resultats[0].nomListe))

await writeJsonFile('dist/projection-circonscriptions-lg2024.json', output)
