#!/usr/bin/env node
import process from 'node:process'
import {createReader} from './lib/eu2024-reader.js'
import {createCsvFormatter} from './lib/formatters/csv.js'

const reader = await createReader()

reader
  .pipe(createCsvFormatter())
  .pipe(process.stdout)
