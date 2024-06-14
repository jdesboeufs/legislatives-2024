import {Transform} from 'node:stream'
import Papa from 'papaparse'
import intoStream from 'into-stream'
import getStream from 'get-stream'
import {flattenListes} from '../flatten.js'

export function createCsvFormatter() {
  return new Transform({
    transform(bv, encoding, callback) {
      const rows = flattenListes(bv)
      this.push(Papa.unparse(rows, {header: !this.headerSent, newline: '\n', quotes: true}) + '\n')
      this.headerSent = true
      callback()
    },
    objectMode: true
  })
}

export function asCsv(items) {
  return getStream(intoStream.object(items).pipe(createCsvFormatter()))
}
