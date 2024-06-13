/* eslint-disable quote-props */
import {readFile} from 'node:fs/promises'
import {Transform} from 'node:stream'
import got from 'got'
import Papa from 'papaparse'
import {keyBy} from 'lodash-es'

function parseInteger(value) {
  return Number.parseInt(value, 10)
}

function parsePercent(value) {
  return Number.parseFloat(value.replace(',', '.').replace('%', ''))
}

function parseCodeCommune(value) {
  if (value.startsWith('ZX')) {
    return '97' + value.slice(2)
  }

  return value.padStart(5, '0')
}

const COLUMNS = {
  'Code localisation': {drop: true},
  'Libellé localisation': {drop: true},
  'Code département': {rename: 'codeDepartement', parse: v => v.padStart(2, '0')},
  'Libellé département': {rename: 'nomDepartement'},
  'Code commune': {rename: 'codeCommune', parse: parseCodeCommune},
  'Libellé commune': {rename: 'nomCommune'},
  'Code BV': {rename: 'codeBureauVote'},
  'Inscrits': {rename: 'inscrits', parse: parseInteger},
  'Votants': {rename: 'votants', parse: parseInteger},
  '% Votants': {rename: 'pourcentageVotants', parse: parsePercent},
  'Abstentions': {rename: 'abstentions', parse: parseInteger},
  '% Abstentions': {rename: 'pourcentageAbstentions', parse: parsePercent},
  'Exprimés': {rename: 'exprimes', parse: parseInteger},
  '% Exprimés/inscrits': {rename: 'pourcentageExprimesInscrits', parse: parsePercent},
  '% Exprimés/votants': {rename: 'pourcentageExprimesVotants', parse: parsePercent},
  'Blancs': {rename: 'blancs', parse: parseInteger},
  '% Blancs/inscrits': {rename: 'pourcentageBlancsInscrits', parse: parsePercent},
  '% Blancs/votants': {rename: 'pourcentageBlancsVotants', parse: parsePercent},
  'Nuls': {rename: 'nuls', parse: parseInteger},
  '% Nuls/inscrits': {rename: 'pourcentageNulsInscrits', parse: parsePercent},
  '% Nuls/votants': {rename: 'pourcentageNulsVotants', parse: parsePercent}
}

const COLUMNS_KEYS = Object.keys(COLUMNS)

const LISTE_COLUMNS = {
  'Numéro de panneau': {drop: true},
  'Nuance liste': {rename: 'nuanceListe'},
  'Libellé abrégé de liste': {rename: 'libelleAbregeListe'},
  'Libellé de liste': {rename: 'libelleListe'},
  'Voix': {rename: 'voixListe', parse: parseInteger},
  '% Voix/inscrits': {rename: 'pourcentageVoixInscritsListe', parse: parsePercent},
  '% Voix/exprimés': {rename: 'pourcentageVoixExprimesListe', parse: parsePercent}
}

function prepareObject(data, definition) {
  const object = {}

  for (const [i, key] of Object.keys(definition).entries()) {
    if (definition[key].drop) {
      continue
    }

    object[definition[key].rename] = definition[key].parse ? definition[key].parse(data[i]) : data[i]
  }

  return object
}

async function prepareCircoIndex() {
  const bvCircoFile = await readFile('dist/bureaux-de-vote-circonscriptions.csv', 'utf8')
  const {data: bvCirco} = Papa.parse(bvCircoFile, {header: true})

  return keyBy(bvCirco, 'codeBureauVote')
}

export async function createReader() {
  const circoIndex = await prepareCircoIndex()

  const inputStream = got.stream('https://static.data.gouv.fr/resources/resultats-des-elections-europeennes-du-9-juin-2024/20240613-154804/resultats-definitifs-par-bureau-de-vote.csv')

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
    header: false,
    delimiter: ';',
    skipEmptyLines: true
  })

  const prepareData = new Transform({
    transform(chunk, encoding, callback) {
      if (this.linesDropped !== 1) {
        this.linesDropped = (this.linesDropped || 0) + 1
        return callback()
      }

      const row = prepareObject(chunk, COLUMNS)
      const circonscription = circoIndex[`${row.codeCommune}_${row.codeBureauVote.padStart(4, '0')}`]

      if (circonscription) {
        row.codeCirconscription = circonscription.codeCirconscription
        row.nomCirconscription = circonscription.nomCirconscription
      }

      const listes = []

      let dataItems = []

      for (const value of chunk.slice(COLUMNS_KEYS.length)) {
        dataItems.push(value)

        if (dataItems.length === 8) {
          listes.push(prepareObject(dataItems, LISTE_COLUMNS))
          dataItems = []
        }
      }

      row.listes = listes
      callback(null, row)
    },
    objectMode: true
  })

  return inputStream.pipe(parseStream).pipe(prepareData)
}
