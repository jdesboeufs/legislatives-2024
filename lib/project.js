import {toPairs} from 'lodash-es'

const DEFAULT_PROJECTION = {
  AUTRE: 100
}

export function projectResults(results, projection) {
  const projectedResults = {}

  for (const result of results) {
    const listeProjections = projection[result.libelle] || projection[result.libelleAbrege] || DEFAULT_PROJECTION

    for (const [listeProjection, ratio] of Object.entries(listeProjections)) {
      projectedResults[listeProjection] = Math.round((projectedResults[listeProjection] || 0) + (result.voix * ratio / 100))
    }
  }

  return toPairs(projectedResults).map(([libelle, voix]) => ({libelle, voix}))
}
