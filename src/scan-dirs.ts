import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import fg from 'fast-glob'
import { parse as parsePath, join, normalize, resolve, extname, dirname } from 'pathe'
import { findExports } from 'mlly'
import { camelCase } from 'scule'
import { Import, ScanDirExportsOptions } from './types'

export async function scanFilesFromDir (dir: string | string[], options?: ScanDirExportsOptions) {
  const dirs = (Array.isArray(dir) ? dir : [dir]).map(d => normalize(d))

  const fileFilter = options?.fileFilter || (() => true)
  const filePatterns = options?.filePatterns || ['*.{ts,js,mjs,cjs,mts,cts}']

  const result = await Promise.all(
    // Do multiple glob searches to persist the order of input dirs
    dirs.map(async i => await fg(
      [i, ...filePatterns.map(p => join(i, p))],
      {
        absolute: true,
        cwd: options?.cwd || process.cwd(),
        onlyFiles: true,
        followSymbolicLinks: true
      })
      .then(r => r
        .map(f => normalize(f))
        .sort()
      )
    )
  )

  return Array.from(new Set(result.flat())).filter(fileFilter)
}

export async function scanDirExports (dir: string | string[], options?: ScanDirExportsOptions) {
  const files = await scanFilesFromDir(dir, options)
  const fileExports = await Promise.all(files.map(i => scanExports(i)))
  return fileExports.flat()
}

const FileExtensionLookup = [
  '.mts',
  '.cts',
  '.ts',
  '.mjs',
  '.cjs',
  '.js'
]

export async function scanExports (filepath: string, seen = new Set<string>()): Promise<Import[]> {
  if (seen.has(filepath)) {
    // eslint-disable-next-line no-console
    console.warn(`[unimport] "${filepath}" is already scanned, skipping`)
    return []
  }

  seen.add(filepath)
  const imports: Import[] = []
  const code = await readFile(filepath, 'utf-8')
  const exports = findExports(code)
  const defaultExport = exports.find(i => i.type === 'default')

  if (defaultExport) {
    let name = parsePath(filepath).name
    if (name === 'index') {
      name = parsePath(filepath.split('/').slice(0, -1).join('/')).name
    }
    // Only camel-case name if it contains separators by which scule would split,
    // see STR_SPLITTERS: https://github.com/unjs/scule/blob/main/src/index.ts
    const as = /[-_.]/.test(name) ? camelCase(name) : name
    imports.push({ name: 'default', as, from: filepath })
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
    } else if (exp.type === 'star' && exp.specifier) {
      if (exp.name) {
        // export * as foo from './foo'
        imports.push({ name: exp.name, as: exp.name, from: filepath })
      } else {
        // export * from './foo', scan deeper
        const subfile = exp.specifier
        let subfilepath = resolve(dirname(filepath), subfile)

        if (!extname(subfilepath)) {
          for (const ext of FileExtensionLookup) {
            if (existsSync(`${subfilepath}${ext}`)) {
              subfilepath = `${subfilepath}${ext}`
              break
            } else if (existsSync(`${subfilepath}/index${ext}`)) {
              subfilepath = `${subfilepath}/index${ext}`
              break
            }
          }
        }

        if (!existsSync(subfilepath)) {
          // eslint-disable-next-line no-console
          console.warn(`[unimport] failed to resolve "${subfilepath}", skip scanning`)
          continue
        }

        imports.push(...await scanExports(subfilepath, seen))
      }
    }
  }

  return imports
}
