import {createRequire} from 'node:module'
import {readJsonFile} from './json.js'

const require = createRequire(import.meta.url)

export const departements = await readJsonFile(require.resolve('@etalab/decoupage-administratif/data/departements.json'))
