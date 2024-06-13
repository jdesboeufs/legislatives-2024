export function aggregateBureauxDeVote(bureauxDeVote) {
  const listesIndex = {}
  const aggregateResult = {
    inscrits: 0,
    votants: 0,
    abstentions: 0,
    exprimes: 0,
    blancs: 0,
    nuls: 0
  }

  for (const bureauDeVote of bureauxDeVote) {
    for (const liste of bureauDeVote.listes) {
      const {nuance, libelleAbrege, libelle} = liste

      listesIndex[libelleAbrege] ||= {
        nuance,
        libelleAbrege,
        libelle,
        voix: 0
      }

      listesIndex[libelleAbrege].voix += liste.voix
    }

    aggregateResult.inscrits += bureauDeVote.inscrits
    aggregateResult.votants += bureauDeVote.votants
    aggregateResult.abstentions += bureauDeVote.abstentions
    aggregateResult.exprimes += bureauDeVote.exprimes
    aggregateResult.blancs += bureauDeVote.blancs
    aggregateResult.nuls += bureauDeVote.nuls
  }

  for (const liste of Object.values(listesIndex)) {
    liste.pourcentageVoixInscrits = roundPrecision(liste.voix / aggregateResult.inscrits * 100, 2)
    liste.pourcentageVoixExprimes = roundPrecision(liste.voix / aggregateResult.exprimes * 100, 2)
  }

  aggregateResult.pourcentageVotants = roundPrecision(aggregateResult.votants / aggregateResult.inscrits * 100, 2)
  aggregateResult.pourcentageAbstentions = roundPrecision(aggregateResult.abstentions / aggregateResult.inscrits * 100, 2)
  aggregateResult.pourcentageExprimesInscrits = roundPrecision(aggregateResult.exprimes / aggregateResult.inscrits * 100, 2)
  aggregateResult.pourcentageExprimesVotants = roundPrecision(aggregateResult.exprimes / aggregateResult.votants * 100, 2)
  aggregateResult.pourcentageBlancsInscrits = roundPrecision(aggregateResult.blancs / aggregateResult.inscrits * 100, 2)
  aggregateResult.pourcentageBlancsVotants = roundPrecision(aggregateResult.blancs / aggregateResult.votants * 100, 2)
  aggregateResult.pourcentageNulsInscrits = roundPrecision(aggregateResult.nuls / aggregateResult.inscrits * 100, 2)
  aggregateResult.pourcentageNulsVotants = roundPrecision(aggregateResult.nuls / aggregateResult.votants * 100, 2)

  return {listes: Object.values(listesIndex), ...aggregateResult}
}

function roundPrecision(number, precision) {
  const factor = 10 ** precision
  return Math.round(number * factor) / factor
}
