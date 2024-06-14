import {omit} from 'lodash-es'

export function flattenListes(item) {
  const result = []

  for (const liste of item.listes) {
    result.push({
      ...omit(item, 'listes'),
      nuanceListe: liste.nuance,
      libelleAbregeListe: liste.libelleAbrege,
      libelleListe: liste.libelle,
      voixListe: liste.voix,
      pourcentageVoixInscritsListe: liste.pourcentageVoixInscrits,
      pourcentageVoixExprimesListe: liste.pourcentageVoixExprimes
    })
  }

  return result
}
