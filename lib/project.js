import {toPairs} from 'lodash-es'

export function projectResults(results, projection) {
  const projectedResults = {}

  for (const result of results) {
    const listeProjections = projection[result.libelle] || {AUTRES: 100}

    for (const [listeProjection, ratio] of Object.entries(listeProjections)) {
      projectedResults[listeProjection] = Math.round((projectedResults[listeProjection] || 0) + (result.voix * ratio))
    }
  }

  return toPairs(projectedResults).map(([libelle, voix]) => ({libelle, voix}))
}
