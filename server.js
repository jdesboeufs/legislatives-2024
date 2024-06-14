import process from 'node:process'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import {keyBy, groupBy} from 'lodash-es'
import {createReader} from './lib/eu2024-reader.js'
import {aggregateBureauxDeVote} from './lib/aggregate.js'
import {asCsv} from './lib/formatters/csv.js'

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

app.use((req, res, next) => {
  res.sendItems = async items => {
    try {
      if (req.query.format === 'csv') {
        const csvData = await asCsv(items)
        res.type('text/csv').send(csvData)
      } else {
        res.send(items)
      }
    } catch (error) {
      res.status(500).send({
        error: 'Impossible de générer le fichier CSV',
        internal: error.message
      })
    }
  }

  next()
})

app.get('/communes/:codeCommune/bureaux-de-vote/:codeBureauDeVote', (req, res) => {
  const bureauDeVote = bureauxDeVoteIndex[`${req.params.codeCommune}_${req.params.codeBureauDeVote.padStart(4, '0')}`]

  if (!bureauDeVote) {
    return res.status(404).send({error: 'Bureau de vote non trouvé'})
  }

  res.send(bureauDeVote)
})

app.get('/circonscriptions/:codeCirconscription/bureaux-de-vote', (req, res) => {
  const circonscription = circonscriptionsIndex[req.params.codeCirconscription]

  if (!circonscription) {
    return res.status(404).send({error: 'Circonscription non trouvée'})
  }

  res.sendItems(circonscription)
})

app.get('/circonscriptions/:codeCirconscription', (req, res) => {
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

  res.send(circonscription)
})

app.get('/circonscriptions', (req, res) => {
  const circonscriptions = Object.values(circonscriptionsIndex).map(bureauxDeVote => ({
    codeDepartement: bureauxDeVote[0].codeDepartement,
    nomDepartement: bureauxDeVote[0].nomDepartement,
    codeCirconscription: bureauxDeVote[0].codeCirconscription,
    ...aggregateBureauxDeVote(bureauxDeVote)
  }))

  res.sendItems(circonscriptions)
})

app.get('/communes/:codeCommune/bureaux-de-vote', (req, res) => {
  const bureauxDeVote = communesIndex[req.params.codeCommune]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Commune non trouvée'})
  }

  res.sendItems(bureauxDeVote)
})

app.get('/communes/:codeCommune', (req, res) => {
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

  res.send(commune)
})

app.get('/departements/:codeDepartement/bureaux-de-vote', (req, res) => {
  const bureauxDeVote = departementsIndex[req.params.codeDepartement]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Département non trouvé'})
  }

  res.sendItems(bureauxDeVote)
})

app.get('/departements/:codeDepartement', (req, res) => {
  const bureauxDeVote = departementsIndex[req.params.codeDepartement]

  if (!bureauxDeVote) {
    return res.status(404).send({error: 'Département non trouvé'})
  }

  const departement = {
    codeDepartement: bureauxDeVote[0].codeDepartement,
    nomDepartement: bureauxDeVote[0].nomDepartement,
    ...aggregateBureauxDeVote(bureauxDeVote)
  }

  res.send(departement)
})

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`)
})
