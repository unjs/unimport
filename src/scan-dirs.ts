import { promises as fs } from 'fs'
import fg from 'fast-glob'
import { parse as parsePath, join, normalize } from 'pathe'
import { findExports } from 'mlly'
import { camelCase } from 'scule'
import { Import, ScanDirExportsOptions } from './types'

export async function scanDirExports (dir: string | string[], options?: ScanDirExportsOptions) {
  const dirs = (Array.isArray(dir) ? dir : [dir]).map(d => normalize(d))

  const fileFilter = options?.fileFilter || (() => true)
  const filePatterns = options?.filePatterns || ['*.{ts,js,mjs,cjs,mts,cts}']

  const result = await Promise.all(
    // Do multiple glob searches to persist the order of input dirs
    dirs.map(async i => await fg(
      [i, ...filePatterns].map(p => join(i, p)),
      {
        absolute: true,
        cwd: options?.cwd || process.cwd(),
        onlyFiles: true,
        followSymbolicLinks: true
      })
      .then(r => r
        .map(f => normalize(f))
        .filter(fileFilter)
        .sort()
      )
    )
  )

  const files = Array.from(new Set(result.flat())).filter(fileFilter)
  const fileExports = await Promise.all(files.map(scanExports))

  return fileExports.flat()
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
