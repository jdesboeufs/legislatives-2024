import {readFile, writeFile} from 'node:fs/promises'

export async function readJsonFile(path) {
  const data = await readFile(path, 'utf8')
  return JSON.parse(data)
}

export async function writeJsonFile(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2))
}
