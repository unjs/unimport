import { promises as fs } from 'fs'
import fg from 'fast-glob'
import { parse as parsePath, join } from 'pathe'
import { findExports } from 'mlly'
import { camelCase } from 'scule'
import { Import, ScanDirExportsOptions } from './types'

export async function scanDirExports (dir: string | string[], options?: ScanDirExportsOptions) {
  const dirs = Array.isArray(dir) ? dir : [dir]

  const fileFilter = options?.fileFilter || (() => true)
  const filePatterns = options?.filePatterns || ['*.{ts,js,mjs,cjs,mts,cts}']
  const files = await fg(
    dirs.flatMap(i => [
      i,
      ...filePatterns.map(p => join(i, p))
    ]),
    {
      absolute: true,
      cwd: options?.cwd || process.cwd(),
      onlyFiles: true,
      followSymbolicLinks: true
    }
  ).then(r => r.filter(fileFilter))

  const imports: Import[] = []

  await Promise.all(
    files.map(async (path) => {
      imports.push(...await scanExports(path))
    })
  )

  return imports
}

export async function scanExports (filepath: string) {
  const imports: Import[] = []
  const code = await fs.readFile(filepath, 'utf-8')
  const exports = findExports(code)
  const defaultExport = exports.find(i => i.type === 'default')

  if (defaultExport) {
    let name = parsePath(filepath).name
    if (name === 'index') {
      name = parsePath(filepath.split('/').slice(0, -1).join('/')).name
    }
    imports.push({ name: 'default', as: camelCase(name), from: filepath })
  }

  for (const exp of exports) {
    if (exp.type === 'named') {
      for (const name of exp.names) {
        imports.push({ name, as: name, from: filepath })
      }
    } else if (exp.type === 'declaration') {
      if (exp.name) {
        imports.push({ name: exp.name, as: exp.name, from: filepath })
      }
    }
  }

  return imports
}
