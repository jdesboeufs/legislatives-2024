#!/usr/bin/env node
import {writeFile, mkdir} from 'node:fs/promises'
import {computeResultats} from './lib/eur2024.js'

await mkdir('dist', {recursive: true})

const resultats = await computeResultats()
await writeFile('dist/resultats-eu2024.json', JSON.stringify(resultats, null, 2))
