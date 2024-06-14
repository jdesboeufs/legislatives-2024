import process from 'node:process'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import {keyBy, groupBy} from 'lodash-es'
import got from 'got'
import {createReader} from './lib/eu2024-reader.js'
import {aggregateBureauxDeVote} from './lib/aggregate.js'
import {asCsv} from './lib/formatters/csv.js'
import {projectResults} from './lib/project.js'

/* Préparation des données brutes */

const bureauxDeVote = []
const reader = await createReader()

for await (const bv of reader) {
  bureauxDeVote.push(bv)
}

const bureauxDeVoteIndex = keyBy(bureauxDeVote, i => `${i.codeCommune}_${i.codeBureauVote}`)
const circonscriptionsIndex = groupBy(bureauxDeVote, 'codeCirconscription')
const communesIndex = groupBy(bureauxDeVote, 'codeCommune')
const departementsIndex = groupBy(bureauxDeVote, 'codeDepartement')

/* API */

const app = express()

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cors({origin: true}))
app.use(express.json())

app.use((req, res, next) => {
  if (!['HEAD', 'GET', 'POST'].includes(req.method)) {
    return res.status(405).send({error: 'Méthode non autorisée'})
  }

  next()
})

const ALLOWED_DOMAIN_PREFIX = ['https://gist.githubusercontent.com']

app.use(async (req, res, next) => {
  if (req.query.projectionUrl) {
    if (!ALLOWED_DOMAIN_PREFIX.some(prefix => req.query.projectionUrl.startsWith(prefix))) {
      return res.status(400).send({error: 'URL de projection non autorisée'})
    }

    try {
      const rawProjection = await got(req.query.projectionUrl).json()

      if (!rawProjection.projection) {
        return res.status(400).send({error: 'Projection invalide'})
      }

      req.projection = rawProjection.projection
    } catch (error) {
      return res.status(400).send({error: 'Projection introuvable', internal: error.message})
    }
  }

  if (req.body.projection) {
    req.projection = req.body.projection
  }

  res.sendItems = async items => {
    if (req.projection) {
      items = items.map(item => ({...item, listes: projectResults(item.listes, req.projection)}))
    }

    if (req.query.format === 'csv') {
      try {
        const csvData = await asCsv(items)
        res.type('text/csv').send(csvData)
      } catch (error) {
        res.status(500).send({
          error: 'Impossible de générer le fichier CSV',
          internal: error.message
        })
      }
    } else {
      res.send(items)
    }
  }

  res.sendItem = item => {
    res.send(req.projection
      ? {...item, listes: projectResults(item.listes, req.projection)}
      : item
    )
  }

  next()
})

app.all('/communes/:codeCommune/bureaux-de-vote/:codeBureauDeVote', (req, res) => {
  const bureauDeVote = bureauxDeVoteIndex[`${req.params.codeCommune}_${req.params.codeBureauDeVote.padStart(4, '0')}`]

  if (!bureauDeVote) {
    return res.status(404).send({error: 'Bureau de vote non trouvé'})
  }

  res.sendItem(bureauDeVote)
})

app.all('/circonscriptions/:codeCirconscription/bureaux-de-vote', (req, res) => {
  const circonscription = circonscriptionsIndex[req.params.codeCirconscription]

  if (!circonscription) {
    return res.status(404).send({error: 'Circonscription non trouvée'})
  }

  res.sendItems(circonscription)
})

app.all('/circonscriptions/:codeCirconscription', (req, res) => {
  const bureauxDeVote = circonscriptionsIndex[req.params.codeCirconscription]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Circonscription non trouvée'})
  }

  const circonscription = {
    codeDepartement: bureauxDeVote[0].codeDepartement,
    nomDepartement: bureauxDeVote[0].nomDepartement,
    codeCirconscription: bureauxDeVote[0].codeCirconscription,
    ...aggregateBureauxDeVote(bureauxDeVote)
  }

  res.sendItem(circonscription)
})

app.all('/circonscriptions', (req, res) => {
  const circonscriptions = Object.values(circonscriptionsIndex).map(bureauxDeVote => ({
    codeDepartement: bureauxDeVote[0].codeDepartement,
    nomDepartement: bureauxDeVote[0].nomDepartement,
    codeCirconscription: bureauxDeVote[0].codeCirconscription,
    ...aggregateBureauxDeVote(bureauxDeVote)
  }))

  res.sendItems(circonscriptions)
})

app.all('/communes/:codeCommune/bureaux-de-vote', (req, res) => {
  const bureauxDeVote = communesIndex[req.params.codeCommune]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Commune non trouvée'})
  }

  res.sendItems(bureauxDeVote)
})

app.all('/communes/:codeCommune', (req, res) => {
  const bureauxDeVote = communesIndex[req.params.codeCommune]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Commune non trouvée'})
  }

  const commune = {
    codeDepartement: bureauxDeVote[0].codeDepartement,
    nomDepartement: bureauxDeVote[0].nomDepartement,
    codeCommune: bureauxDeVote[0].codeCommune,
    nomCommune: bureauxDeVote[0].nomCommune,
    ...aggregateBureauxDeVote(bureauxDeVote)
  }

  res.sendItem(commune)
})

app.all('/departements/:codeDepartement/bureaux-de-vote', (req, res) => {
  const bureauxDeVote = departementsIndex[req.params.codeDepartement]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Département non trouvé'})
  }

  res.sendItems(bureauxDeVote)
})

app.all('/departements/:codeDepartement', (req, res) => {
  const bureauxDeVote = departementsIndex[req.params.codeDepartement]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Département non trouvé'})
  }

  const departement = {
    codeDepartement: bureauxDeVote[0].codeDepartement,
    nomDepartement: bureauxDeVote[0].nomDepartement,
    ...aggregateBureauxDeVote(bureauxDeVote)
  }

  res.sendItem(departement)
})

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`)
})
