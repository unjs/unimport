import type { ESMExport } from 'mlly'
import type { Import, ScanDir, ScanDirExportsOptions } from '../types'

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { findExports, findTypeExports, resolve as mllyResolve } from 'mlly'
import { basename, dirname, join, normalize, parse as parsePath, resolve } from 'pathe'
import pm from 'picomatch'
import { camelCase } from 'scule'
import { glob } from 'tinyglobby'

const RE_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

/**
 * Extracts actual declarator names from an `ESMExport.code` string for
 * `const`/`let`/`var` declarations. mlly's regex-based parser can leak
 * identifiers from the RHS of assignments (e.g. generic type parameters,
 * function parameters) into `exp.names`. This function re-parses the code
 * with bracket-depth tracking to only return names that appear on the LHS
 * of declarators.
 *
 * Returns `undefined` for `function`/`class`/`enum` declarations where
 * `exp.names` is always correct, or if the code can't be parsed.
 *
 * @see https://github.com/unjs/unimport/issues/502
 */
function extractDeclaratorNames(code: string): string[] | undefined {
  const match = code.match(/^export\s+(?:default\s+)?(?:const|let|var)\s+/)
  if (!match)
    return undefined

  const rest = code.slice(match[0].length)
  const names: string[] = []
  let angleDepth = 0
  let parenDepth = 0
  let braceDepth = 0
  let bracketDepth = 0
  let current = ''
  let inValue = false

  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i]

    if (ch === '<') angleDepth++
    else if (ch === '>') angleDepth = Math.max(0, angleDepth - 1)
    else if (ch === '(') parenDepth++
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    else if (ch === '{') braceDepth++
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1)
    else if (ch === '[') bracketDepth++
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1)

    const isTopLevel = angleDepth === 0 && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0

    if (ch === '=' && isTopLevel && !inValue) {
      const name = current.trim()
      if (name && RE_IDENTIFIER.test(name))
        names.push(name)
      inValue = true
      current = ''
    }
    else if (ch === ',' && isTopLevel) {
      inValue = false
      current = ''
    }
    else if (!inValue) {
      current += ch
    }
  }

  // Handle trailing name without '=' (mlly truncates code before the value)
  if (!inValue) {
    const name = current.trim()
    if (name && RE_IDENTIFIER.test(name))
      names.push(name)
  }

  return names.length > 0 ? names : undefined
}

const FileExtensionLookup = [
  'mts',
  'cts',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'js',
  'jsx',
]

const FileLookupPatterns = `*.{${FileExtensionLookup.join(',')}}`

const RE_EXCLAMATION_PREFIX = /^!/
const RE_FILE_EXT = /\.\w+$/
const RE_NAME_SEPARATOR = /[-_.]/
const RE_DTS_EXT = /\.d\.[mc]?ts$/

function resolveGlobsExclude(glob: string, cwd: string) {
  return `${glob.startsWith('!') ? '!' : ''}${resolve(cwd, glob.replace(RE_EXCLAMATION_PREFIX, ''))}`
}

function joinGlobFilePattern(glob: string, filePattern: string) {
  return join(basename(glob) === '*' ? dirname(glob) : glob, filePattern)
}

export function normalizeScanDirs(dirs: (string | ScanDir)[], options?: ScanDirExportsOptions): Required<ScanDir>[] {
  const topLevelTypes = options?.types ?? true
  const cwd = options?.cwd ?? process.cwd()
  const filePatterns = options?.filePatterns || [FileLookupPatterns]

  return dirs.map((dir) => {
    const isString = typeof dir === 'string'
    const glob = resolveGlobsExclude(isString ? dir : dir.glob, cwd)
    const types = isString ? topLevelTypes : (dir.types ?? topLevelTypes)

    // Ends with a extension, consider as a file
    if (RE_FILE_EXT.test(glob))
      return { glob, types }

    // Otherwise, append the default file patterns `*.{mts,cts,ts,tsx,mjs,cjs,js,jsx}`
    const withFilePatterns = filePatterns.map(filePattern => ({ glob: joinGlobFilePattern(glob, filePattern), types }))
    return [{ glob, types }, ...withFilePatterns]
  }).flat()
}

export async function scanFilesFromDir(dir: ScanDir | ScanDir[], options?: ScanDirExportsOptions) {
  const dirGlobs = (Array.isArray(dir) ? dir : [dir]).map(i => i.glob)
  const files = (await glob(
    dirGlobs,
    {
      absolute: true,
      cwd: options?.cwd || process.cwd(),
      onlyFiles: true,
      followSymbolicLinks: true,
      expandDirectories: false,
    },
  ))
    .map(i => normalize(i))

  const fileFilter = options?.fileFilter || (() => true)

  const indexOfDirs = (file: string) => dirGlobs.findIndex(glob => pm.isMatch(file, glob))
  const fileSortByDirs = files.reduce((acc, file) => {
    const index = indexOfDirs(file)
    if (acc[index])
      acc[index].push(normalize(file))
    else
      acc[index] = [normalize(file)]
    return acc
  }, [] as string[][]).map(files => files.sort()).flat()

  return fileSortByDirs.filter(fileFilter)
}

export async function scanDirExports(dirs: (string | ScanDir)[], options?: ScanDirExportsOptions) {
  const normalizedDirs = normalizeScanDirs(dirs, options)
  const files = await scanFilesFromDir(normalizedDirs, options)

  const includeTypesDirs = normalizedDirs.filter(dir => !dir.glob.startsWith('!') && dir.types)
  const isIncludeTypes = (file: string) => includeTypesDirs.some(dir => pm.isMatch(file, dir.glob))

  const imports = (await Promise.all(files.map(file => scanExports(file, isIncludeTypes(file))))).flat()
  const deduped = dedupeDtsExports(imports)
  return deduped
}

export function dedupeDtsExports(exports: Import[]) {
  // Dedupe imports for the same export name exists in both `.js` and `.d.ts` file,
  // We remove the type-only entry
  return exports.filter((i) => {
    if (!i.type)
      return true

    // import enum and class as both value and type
    if (i.declarationType === 'enum' || i.declarationType === 'const enum' || i.declarationType === 'class')
      return true

    return !exports.some(e => e.as === i.as && e.name === i.name && !e.type)
  })
}

export async function scanExports(filepath: string, includeTypes: boolean, seen = new Set<string>()): Promise<Import[]> {
  if (seen.has(filepath)) {
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
    if (name === 'index')
      name = parsePath(filepath.split('/').slice(0, -1).join('/')).name

    // Only camel-case name if it contains separators by which scule would split,
    // see STR_SPLITTERS: https://github.com/unjs/scule/blob/main/src/index.ts
    const as = RE_NAME_SEPARATOR.test(name) ? camelCase(name) : name
    imports.push({ name: 'default', as, from: filepath })
  }

  async function toImport(exports: ESMExport[], additional?: Partial<Import>) {
    for (const exp of exports) {
      if (exp.type === 'named') {
        for (const name of exp.names)
          imports.push({ name, as: name, from: filepath, ...additional })
      }
      else if (exp.type === 'declaration') {
        // For const/let/var declarations, mlly's regex parser may include
        // identifiers from the RHS (generic type params, function params) in
        // exp.names. Re-extract names with bracket-depth tracking to filter
        // those out. For function/class/enum declarations, exp.names is reliable.
        const names = extractDeclaratorNames(exp.code) ?? exp.names
        for (const name of names) {
          imports.push({ name, as: name, from: filepath, ...additional })
          if (exp.declarationType === 'enum' || exp.declarationType === 'const enum' || exp.declarationType === 'class') {
            imports.push({ name, as: name, from: filepath, type: true, declarationType: exp.declarationType, ...additional })
          }
        }
      }
      else if (exp.type === 'star' && exp.specifier) {
        if (exp.name) {
          // export * as foo from './foo'
          imports.push({ name: exp.name, as: exp.name, from: filepath, ...additional })
        }
        else {
          // export * from './foo', scan deeper
          const subfile = exp.specifier
          let subfilepath = resolve(dirname(filepath), subfile)
          let subfilepathResolved = false

          for (const ext of FileExtensionLookup) {
            if (existsSync(`${subfilepath}.${ext}`)) {
              subfilepath = `${subfilepath}.${ext}`
              break
            }
            else if (existsSync(`${subfilepath}/index.${ext}`)) {
              subfilepath = `${subfilepath}/index.${ext}`
              break
            }
          }

          if (existsSync(subfilepath)) {
            subfilepathResolved = true
          }
          else {
            // Try to resolve the module
            try {
              subfilepath = await mllyResolve(exp.specifier)
              subfilepath = normalize(fileURLToPath(subfilepath))
              if (existsSync(subfilepath)) {
                subfilepathResolved = true
              }
            }
            catch {}
          }

          if (!subfilepathResolved) {
            console.warn(`[unimport] failed to resolve "${subfilepath}", skip scanning`)
            continue
          }

          const nested = await scanExports(subfilepath, includeTypes, seen)
          imports.push(...(additional
            ? nested.map(i => ({ ...i, ...additional }))
            : nested
          ))
        }
      }
    }
  }

  const isDts = filepath.match(RE_DTS_EXT)

  if (isDts) {
    if (includeTypes) {
      await toImport(exports, { type: true })
      await toImport(findTypeExports(code), { type: true })
    }
  }
  else {
    await toImport(exports)
    if (includeTypes)
      await toImport(findTypeExports(code), { type: true })
  }

  return imports
}
