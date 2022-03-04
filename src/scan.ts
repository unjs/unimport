import { promises as fs } from 'fs'
import { globby } from 'globby'
import { resolve, parse as parsePath } from 'pathe'
import { findExports } from 'mlly'
import { camelCase } from 'scule'
import { Import } from './types'

export async function resolveFiles (path: string, pattern: string | string[]) {
  const files = await globby(pattern, { cwd: path, followSymbolicLinks: true })
  return files.map(p => resolve(path, p))
}

export async function scanAPIsFromDirectory (dir: string | string[], filterFile: (file: string) => boolean = () => true) {
  const dirs = Array.isArray(dir) ? dir : [dir]

  const files = await Promise.all(
    dirs.map(i => resolveFiles(i, [
      '*.{ts,js,mjs,cjs,mts,cts}',
      '*/index.{ts,js,mjs,cjs,mts,cts}'
    ]))
  ).then(r => r.flat().filter(filterFile))

  const imports: Import[] = []

  await Promise.all(
    files.map(async (path) => {
      imports.push(...await scanAPIsFromFile(path))
    })
  )

  return imports
}

export async function scanAPIsFromFile (path: string) {
  const imports: Import[] = []
  const code = await fs.readFile(path, 'utf-8')
  const exports = findExports(code)
  const defaultExport = exports.find(i => i.type === 'default')

  if (defaultExport) {
    let name = parsePath(path).name
    if (name === 'index') {
      name = parsePath(path.split('/').slice(0, -1).join('/')).name
    }
    imports.push({ name: 'default', as: camelCase(name), from: path })
  }
  for (const exp of exports) {
    if (exp.type === 'named') {
      for (const name of exp.names) {
        imports.push({ name, as: name, from: path })
      }
    } else if (exp.type === 'declaration') {
      imports.push({ name: exp.name, as: exp.name, from: path })
    }
  }

  return imports
}
