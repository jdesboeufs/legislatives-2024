#!/usr/bin/env node
import {writeFile} from 'node:fs/promises'
import Papa from 'papaparse'
import {readJsonFile} from './lib/json.js'
import {prepareCirconscriptionsHelper} from './lib/circonscriptions.js'

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
      circonscriptionEntry.voix[resultat.nomListe] ||= 0
      circonscriptionEntry.voix[resultat.nomListe] += resultat.nbVoix * ratio
    }
  }
}

const csvRows = []

for (const [codeCirconscription, circonscription] of resultatsCirconscriptions.entries()) {
  const {exprimes, abstentions, inscrits} = circonscription

  for (const [nomListe, nbVoix] of Object.entries(circonscription.voix)) {
    csvRows.push({
      codeCirconscription,
      inscrits: roundPrecision(inscrits, 0),
      votesExprimes: roundPrecision(exprimes, 0),
      abstentions: roundPrecision(abstentions, 0),
      tauxAbstention: roundPrecision(abstentions / inscrits * 100, 2),
      nomListe,
      nbVoix,
      pourcentage: roundPrecision(nbVoix / exprimes * 100, 2)
    })
  }
}

const csvData = Papa.unparse(csvRows, {
  delimiter: ';'
})

await writeFile('dist/resultats-eu2024-circonscriptions.csv', csvData)

/* Helpers */

function roundPrecision(value, precision) {
  const multiplier = 10 ** precision
  return Math.round(value * multiplier) / multiplier
}
