import {parseString} from 'xml2js'
import got from 'got'
import {departements} from './cog.js'

function getDataUrl(departement) {
  return `https://www.resultats-elections.interieur.gouv.fr/telechargements/EU2024/resultatsT1/${departement.region}/${departement.code}/R1${departement.code}COM.xml`
}

async function readRemoteXml(url) {
  const data = await got(url).text()
  return new Promise((resolve, reject) => {
    parseString(data, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

function parseResultats(data) {
  return data.Election.Departement[0].Communes[0].Commune.map(item => ({
    codeCommune: item.CodCom[0],
    nomCommune: item.LibCom[0],
    inscrits: Number.parseInt(item.Tours[0].Tour[0].Mentions[0].Inscrits[0].Nombre[0], 10),
    votants: Number.parseInt(item.Tours[0].Tour[0].Mentions[0].Votants[0].Nombre[0], 10),
    blancs: Number.parseInt(item.Tours[0].Tour[0].Mentions[0].Blancs[0].Nombre[0], 10),
    abstentions: Number.parseInt(item.Tours[0].Tour[0].Mentions[0].Abstentions[0].Nombre[0], 10),
    nuls: Number.parseInt(item.Tours[0].Tour[0].Mentions[0].Nuls[0].Nombre[0], 10),
    exprimes: Number.parseInt(item.Tours[0].Tour[0].Mentions[0].Exprimes[0].Nombre[0], 10),
    resultats: item.Tours[0].Tour[0].Resultats[0].Listes[0].Liste.map(liste => ({
      nomListe: liste.NomListe[0],
      nbVoix: Number.parseInt(liste.NbVoix[0], 10)
    }))
  }))
}

export async function computeResultats() {
  const resultats = []

  // On ne conserve que la France métropolitaine pour le moment car pour les autres territoires il faut travailler un peu plus (correspondance avec les données du ministère, codification etc.)
  // On reste sur un for..of sous-optimal car il n'y a pas d'enjeu de performance ici
  for (const departement of departements.filter(d => d.zone === 'metro')) {
    const url = getDataUrl(departement)
    /* eslint-disable-next-line no-await-in-loop */
    const data = await readRemoteXml(url)

    for (const commune of parseResultats(data)) {
      resultats.push(commune)
    }

    console.log(`Traitement du département ${departement.code} terminé`)
  }

  return resultats
}
