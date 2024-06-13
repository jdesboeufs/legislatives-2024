import {writeFile} from 'node:fs/promises'
import got from 'got'
import Papa from 'papaparse'
import iconv from 'iconv-lite'

const NORMALIZE_DEPARTEMENT = {
  ZA: '971',
  ZB: '972',
  ZC: '973',
  ZD: '974',
  ZM: '976',
  ZN: '988',
  ZP: '987',
  ZS: '975',
  ZW: '986'
}

function getCodeDepartement(rawCodeDepartement, rawCodeCommune) {
  if (rawCodeDepartement === 'ZZ') {
    return 'ZZ'
  }

  if (rawCodeDepartement === 'ZX' && rawCodeCommune.startsWith('7')) {
    return '977'
  }

  if (rawCodeDepartement === 'ZX' && rawCodeCommune.startsWith('8')) {
    return '978'
  }

  if (rawCodeDepartement in NORMALIZE_DEPARTEMENT) {
    return NORMALIZE_DEPARTEMENT[rawCodeDepartement]
  }

  return rawCodeDepartement
}

function getCodeCommune(rawCodeDepartement, rawCodeCommune) {
  const codeDepartement = getCodeDepartement(rawCodeDepartement, rawCodeCommune)
  return codeDepartement.slice(0, 2) + rawCodeCommune
}

const rawData = await got('https://static.data.gouv.fr/resources/elections-legislatives-des-12-et-19-juin-2022-resultats-du-1er-tour/20220613-095236/resultats-par-niveau-burvot-t1-france-entiere.txt').buffer()
const decodedData = iconv.decode(rawData, 'iso-8859-1')

const result = Papa.parse(decodedData, {header: false, delimiter: ';', skipEmptyLines: true})

const rows = result.data.slice(1).map(row => ({
  codeDepartement: row[0],
  nomDepartement: row[1],
  codeCirconscription: row[0] + row[2],
  nomCirconscription: row[3],
  codeCommune: getCodeCommune(row[0], row[4]),
  nomCommune: row[5],
  numeroBureauVote: row[6],
  codeBureauVote: getCodeCommune(row[0], row[4]) + '_' + row[6]
}))

const csvContent = Papa.unparse(rows, {header: true, delimiter: ','})
await writeFile('dist/bureaux-de-vote-circonscriptions.csv', csvContent)
