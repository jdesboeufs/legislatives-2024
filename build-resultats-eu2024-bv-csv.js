#!/usr/bin/env node
import process from 'node:process'
import {Transform} from 'node:stream'
import Papa from 'papaparse'
import {createReader} from './lib/eu2024-reader.js'

const serialize = new Transform({
  transform(bv, encoding, callback) {
    for (const liste of bv.listes) {
      this.push(Papa.unparse([{
        codeDepartement: bv.codeDepartement,
        nomDepartement: bv.nomDepartement,
        codeCommune: bv.codeCommune,
        nomCommune: bv.nomCommune,
        codeBureauVote: bv.codeBureauVote,
        codeCirconscription: bv.codeCirconscription,
        nomCirconscription: bv.nomCirconscription,
        inscrits: bv.inscrits,
        votants: bv.votants,
        pourcentageVotants: bv.pourcentageVotants,
        abstentions: bv.abstentions,
        pourcentageAbstentions: bv.pourcentageAbstentions,
        exprimes: bv.exprimes,
        pourcentageExprimesInscrits: bv.pourcentageExprimesInscrits,
        pourcentageExprimesVotants: bv.pourcentageExprimesVotants,
        blancs: bv.blancs,
        pourcentageBlancsInscrits: bv.pourcentageBlancsInscrits,
        pourcentageBlancsVotants: bv.pourcentageBlancsVotants,
        nuls: bv.nuls,
        pourcentageNulsInscrits: bv.pourcentageNulsInscrits,
        pourcentageNulsVotants: bv.pourcentageNulsVotants,
        nuanceListe: liste.nuance,
        libelleAbregeListe: liste.libelleAbrege,
        libelleListe: liste.libelle,
        voixListe: liste.voix,
        pourcentageVoixInscritsListe: liste.pourcentageVoixInscrits,
        pourcentageVoixExprimesListe: liste.pourcentageVoixExprimes
      }], {header: !this.headerSent, newline: '\n', quotes: true}) + '\n')

      this.headerSent = true
    }

    callback()
  },
  objectMode: true
})

const reader = await createReader()

reader
  .pipe(serialize)
  .pipe(process.stdout)
