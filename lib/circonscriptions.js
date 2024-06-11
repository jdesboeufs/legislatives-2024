import got from 'got'
import xlsx from 'node-xlsx'
import {groupBy} from 'lodash-es'

export async function prepareCirconscriptionsHelper() {
  const xlsxData = await got('https://www.insee.fr/fr/statistiques/fichier/6436476/circo_composition.xlsx').buffer()

  const sheets = xlsx.parse(xlsxData)
  const entries = sheets.find(sheet => sheet.name === 'table').data
    .slice(1)
    .map(row => ({
      codeDepartement: row[0],
      nomDepartement: row[1],
      codeRegion: row[2],
      nomRegion: row[3],
      codeCommune: row[4],
      nomCommune: row[5],
      codeCirconscription: row[6],
      typeAssociation: row[7]
    }))

  const indexedByCommunes = groupBy(entries, 'codeCommune')
  const indexedByCirconscriptions = groupBy(entries, 'codeCirconscription')

  return {
    getCirconscriptions(codeCommune) {
      return indexedByCommunes[codeCommune]
    },

    getCommunes(codeCirconscription) {
      return indexedByCirconscriptions[codeCirconscription]
    }
  }
}
