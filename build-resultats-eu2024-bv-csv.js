#!/usr/bin/env node
import process from 'node:process'
import {Transform} from 'node:stream'
import Papa from 'papaparse'
import {createReader} from './lib/eu2024-reader.js'
import {flattenListes} from './lib/flatten.js'

const serialize = new Transform({
  transform(bv, encoding, callback) {
    const rows = flattenListes(bv)
    this.push(Papa.unparse(rows, {header: !this.headerSent, newline: '\n', quotes: true}) + '\n')
    this.headerSent = true
    callback()
  },
  objectMode: true
})

const reader = await createReader()

reader
  .pipe(serialize)
  .pipe(process.stdout)
