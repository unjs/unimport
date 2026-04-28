import type { StaticImport } from 'mlly'
import type { Import, InlinePreset, MagicStringResult, PathFromResolver, ToExportsOptions, TypeDeclarationOptions } from './types'
import MagicString from 'magic-string'
import { findStaticImports, parseStaticImport, resolvePathSync } from 'mlly'
import { isAbsolute, relative } from 'pathe'
import { stripCommentsAndStrings } from './regexp'

export function defineUnimportPreset(preset: InlinePreset): InlinePreset {
  return preset
}

const RE_IDENTIFIER = /^[A-Z_$][\w$]*$/i
const RE_SAFE_PROPERTY_NAME = /^[a-z$_][\w$]*$/i
const RE_FILE_EXT = /\.[a-z]+$/i
const RE_RELATIVE_PATH = /^[./]/
const RE_DTS_EXT = /\.d\.([cm]?)ts$/i
const RE_SHEBANG = /^#!.+/
const RE_IMPORT_BRACE = /^\s*import\s*\{/

function stringifyWith(withValues: Record<string, string>) {
  let withDefs = ''
  for (let entries = Object.entries(withValues), l = entries.length, i = 0; i < l; i++) {
    const [prop, value] = entries[i]
    withDefs += RE_SAFE_PROPERTY_NAME.test(prop) ? prop : JSON.stringify(prop)
    withDefs += `: ${JSON.stringify(String(value))}`
    if ((i + 1) !== l)
      withDefs += ', '
  }
  return `{ ${withDefs} }`
}

export function stringifyImports(imports: Import[], isCJS = false) {
  const map = toImportModuleMap(imports)
  return Object.entries(map)
    .flatMap(([name, importSet]) => {
      const entries = []
      const imports = Array.from(importSet)
        .filter((i) => {
          // handle special imports
          if (!i.name || i.as === '') {
            let importStr
            if (isCJS) {
              importStr = `require('${name}');`
            }
            else {
              importStr = `import '${name}'`

              if (i.with)
                importStr += ` with ${stringifyWith(i.with)}`

              importStr += ';'
            }

            entries.push(importStr)

            return false
          }
          else if (i.name === 'default' || i.name === '=') {
            let importStr
            if (isCJS) {
              importStr = i.name === '='
                ? `const ${i.as} = require('${name}');`
                : `const { default: ${i.as} } = require('${name}');`
            }
            else {
              importStr = `import ${i.as} from '${name}'`

              if (i.with)
                importStr += ` with ${stringifyWith(i.with)}`

              importStr += ';'
            }

            entries.push(importStr)

            return false
          }
          else if (i.name === '*') {
            let importStr
            if (isCJS) {
              importStr = `const ${i.as} = require('${name}');`
            }
            else {
              importStr = `import * as ${i.as} from '${name}'`

              if (i.with)
                importStr += ` with ${stringifyWith(i.with)}`

              importStr += ';'
            }

            entries.push(importStr)

            return false
          }
          else if (!isCJS && i.with) {
            entries.push(`import { ${stringifyImportAlias(i)} } from '${name}' with ${stringifyWith(i.with)};`)

            return false
          }

          return true
        })

      if (imports.length) {
        const importsAs = imports.map(i => stringifyImportAlias(i, isCJS))

        entries.push(
          isCJS
            ? `const { ${importsAs.join(', ')} } = require('${name}');`
            : `import { ${importsAs.join(', ')} } from '${name}';`,
        )
      }

      return entries
    })
    .join('\n')
}

function encodeImportName(name: string) {
  return `\uFFFF${name}\uFFFE`
}

export function dedupeImports(imports: Import[], warn: (msg: string) => void) {
  const deduped = new Map<string | number, Import>()

  for (let idx = imports.length - 1; idx >= 0; idx--) {
    const currImp = imports[idx]
    if (currImp.disabled || currImp.declarationType === 'enum' || currImp.declarationType === 'const enum' || currImp.declarationType === 'class') {
      deduped.set(idx, currImp)
      continue
    }

    const name = String(currImp.as ?? currImp.name)
    const prevImp = deduped.get(name)
    if (!prevImp) {
      deduped.set(name, currImp)
      continue
    }

    const isSameSpecifier = (currImp.type || prevImp.type)
      ? (currImp.typeFrom || currImp.from) === (prevImp.typeFrom || prevImp.from)
      : currImp.from === prevImp.from

    if (isSameSpecifier) {
      if (Boolean(currImp.type) === Boolean(prevImp.type)) {
        // currImp and prevImp are the same import
        if ((currImp.priority ?? 1) > (prevImp.priority ?? 1)) {
          deduped.delete(name)
          deduped.set(name, currImp)
        }
      }
      else {
        // currImp and prevImp are complementary imports; one for the value and one for the type
        const altName = encodeImportName(name)
        const prevImpComplement = deduped.get(altName)
        if (!prevImpComplement) {
          deduped.set(altName, currImp)
        }
        else if ((currImp.priority ?? 1) > (prevImpComplement.priority ?? 1)) {
          deduped.delete(altName)
          deduped.set(altName, currImp)
        }
      }
      continue
    }

    // currImp and prevImp are duplicate imports
    const altName = encodeImportName(name)
    const prevImpComplement = deduped.get(altName)
    const prevPriority = prevImpComplement
      ? Math.max(prevImp.priority ?? 1, prevImpComplement.priority ?? 1)
      : prevImp.priority ?? 1
    const priorityDiff = (currImp.priority ?? 1) - prevPriority
    if (priorityDiff > 0) {
      deduped.delete(name)
      deduped.delete(altName)
      deduped.set(name, currImp)
    }
    else if (priorityDiff === 0) {
      warn(`Duplicated imports "${name}", the one from "${currImp.from}" has been ignored and "${prevImp.from}" is used`)
    }
  }

  let i = deduped.size
  const dedupedImports = new Array(i) // eslint-disable-line unicorn/no-new-array
  for (const imp of deduped.values()) {
    dedupedImports[--i] = imp
  }
  return dedupedImports
}

export function toExports(imports: Import[], fileDir?: string, includeType = false, options: ToExportsOptions = {}) {
  const map = toImportModuleMap(imports, includeType, options)
  return Object.entries(map)
    .flatMap(([name, imports]) => {
      if (isFilePath(name))
        name = name.replace(RE_FILE_EXT, '')

      if (fileDir && isAbsolute(name)) {
        name = relative(fileDir, name)
        if (!RE_RELATIVE_PATH.test(name))
          name = `./${name}`
      }
      const entries: string[] = []
      const filtered = Array.from(imports).filter((i) => {
        if (i.name === '*') {
          entries.push(`export * as ${i.as} from '${name}';`)
          return false
        }
        return true
      })
      // Dedupe entries that would emit the same exported identifier.
      // Classes, enums and other declarations that live in both the value
      // and type spaces can appear twice when `includeType` is enabled:
      // once as a value import and once as a type-only import. A single
      // `export { Foo }` already re-exports both, so we collapse them and
      // prefer the value import when one is available.
      const byAlias = new Map<string, Import>()
      for (const i of filtered) {
        const key = String(i.as ?? i.name)
        const existing = byAlias.get(key)
        if (!existing || (existing.type && !i.type))
          byAlias.set(key, i)
      }
      const deduped = Array.from(byAlias.values())
      if (deduped.length)
        entries.push(`export { ${deduped.map(i => stringifyImportAlias(i, false)).join(', ')} } from '${name}';`)

      return entries
    })
    .join('\n')
}

export function stripFileExtension(path: string) {
  return path.replace(RE_FILE_EXT, '')
}

export function toTypeDeclarationItems(imports: Import[], options?: TypeDeclarationOptions) {
  return imports
    .map((i) => {
      const from = options?.resolvePath?.(i) || stripFileExtension(i.typeFrom || i.from)
      let typeDef = ''
      if (i.with)
        typeDef += `import('${from}', { with: ${stringifyWith(i.with)} })`
      else
        typeDef += `import('${from}')`

      if (i.name !== '*' && i.name !== '=')
        typeDef += RE_IDENTIFIER.test(i.name) ? `.${i.name}` : `['${i.name}']`

      return `const ${i.as}: typeof ${typeDef}`
    })
    .sort()
}

export function toTypeDeclarationFile(imports: Import[], options?: TypeDeclarationOptions) {
  const items = toTypeDeclarationItems(imports, options)
  const {
    exportHelper = true,
  } = options || {}

  let declaration = ''
  if (exportHelper)
    declaration += 'export {}\n'

  declaration += `declare global {\n${items.map(i => `  ${i}`).join('\n')}\n}`
  return declaration
}

function makeTypeModulesMap(imports: Import[], resolvePath?: PathFromResolver) {
  const modulesMap = new Map<string, { starTypeImport: Import | undefined, typeImports: Set<Import> }>()
  const resolveImportFrom = typeof resolvePath === 'function'
    ? (i: Import) => {
        return resolvePath(i) || stripFileExtension(i.typeFrom || i.from)
      }
    : (i: Import) => stripFileExtension(i.typeFrom || i.from)
  for (const import_ of imports) {
    const from = resolveImportFrom(import_)
    let module = modulesMap.get(from)
    if (!module) {
      module = { typeImports: new Set(), starTypeImport: undefined }
      modulesMap.set(from, module)
    }
    if (import_.name === '*') {
      if (import_.as)
        module.starTypeImport = import_
    }
    else {
      module.typeImports.add(import_)
    }
  }
  return modulesMap
}

export function toTypeReExports(imports: Import[], options?: TypeDeclarationOptions) {
  const importsMap = makeTypeModulesMap(imports, options?.resolvePath)
  const code = Array.from(importsMap).flatMap(([from, module]) => {
    // ensure we have the correct file extension if we are handling raw declarations
    from = from.replace(RE_DTS_EXT, '.$1js')

    const { starTypeImport, typeImports } = module
    // TypeScript incorrectly reports an error when re-exporting types in a d.ts file.
    // We use @ts-ignore to suppress the error since it actually works.
    const strings: string[] = []
    if (typeImports.size) {
      const typeImportNames = Array.from(typeImports).map(({ name, as }) => {
        if (as && as !== name)
          return `${name} as ${as}`
        return name
      })
      strings.push(
        '// @ts-ignore',
        `export type { ${typeImportNames.join(', ')} } from '${from}'`,
      )
    }
    if (starTypeImport) {
      strings.push(
        '// @ts-ignore',
        `export type * as ${starTypeImport.as} from '${from}'`,
      )
    }
    if (strings.length) {
      strings.push(
        // This is a workaround for a TypeScript issue where type-only re-exports are not properly initialized.
        `import('${from}')`,
      )
    }
    return strings
  })
  return `// for type re-export\ndeclare global {\n${code.map(i => `  ${i}`).join('\n')}\n}`
}

function stringifyImportAlias(item: Import, isCJS = false) {
  return (item.as === undefined || item.name === item.as)
    ? item.name
    : isCJS
      ? `${item.name}: ${item.as}`
      : `${item.name} as ${item.as}`
}

function toImportModuleMap(imports: Import[], includeType = false, options: ToExportsOptions = {}) {
  const map: Record<string, Set<Import>> = {}
  for (const _import of imports) {
    if (_import.type && !includeType)
      continue

    const from = (options.declaration && _import.typeFrom) || _import.from
    if (!map[from])
      map[from] = new Set()

    map[from].add(_import)
  }
  return map
}

export function getString(code: string | MagicString) {
  if (typeof code === 'string')
    return code
  return code.toString()
}

export function getMagicString(code: string | MagicString) {
  if (typeof code === 'string')
    return new MagicString(code)

  return code
}

export function addImportToCode(
  code: string | MagicString,
  imports: Import[],
  isCJS = false,
  mergeExisting = false,
  injectAtLast = false,
  firstOccurrence = Number.POSITIVE_INFINITY,
  onResolved?: (imports: Import[]) => void | Import[],
  onStringified?: (str: string, imports: Import[]) => void | string,
): MagicStringResult {
  let newImports: Import[] = []
  const s = getMagicString(code)

  let _staticImports: StaticImport[] | undefined
  const strippedCode = stripCommentsAndStrings(s.original)

  function findStaticImportsLazy() {
    if (!_staticImports) {
      _staticImports = findStaticImports(s.original)
        .filter(i => Boolean(strippedCode.slice(i.start, i.end).trim()))
        .map(i => parseStaticImport(i))
    }
    return _staticImports
  }

  function hasShebang() {
    return RE_SHEBANG.test(s.original)
  }

  if (mergeExisting && !isCJS) {
    const existingImports = findStaticImportsLazy()
    const map = new Map<StaticImport, Import[]>()

    imports.forEach((i) => {
      const target = existingImports.find(e => e.specifier === i.from && e.imports.startsWith('{'))
      if (!target)
        return newImports.push(i)

      if (!map.has(target))
        map.set(target, [])

      map.get(target)!.push(i)
    })

    for (const [target, items] of map.entries()) {
      const strings = items.map(i => `${stringifyImportAlias(i)}, `)
      const importLength = target.code.match(RE_IMPORT_BRACE)?.[0]?.length
      if (importLength)
        s.appendLeft(target.start + importLength, ` ${strings.join('').trim()}`)
    }
  }
  else {
    newImports = imports
  }

  newImports = onResolved?.(newImports) ?? newImports

  let newEntries = stringifyImports(newImports, isCJS)
  newEntries = onStringified?.(newEntries, newImports) ?? newEntries

  if (newEntries) {
    const insertionIndex = injectAtLast
      ? findStaticImportsLazy().reverse().find(i => i.end <= firstOccurrence)?.end ?? 0
      : 0

    if (insertionIndex > 0)
      s.appendRight(insertionIndex, `\n${newEntries}\n`)
    else if (hasShebang())
      s.appendLeft(s.original.indexOf('\n') + 1, `\n${newEntries}\n`)
    else
      s.prepend(`${newEntries}\n`)
  }

  return {
    s,
    get code() { return s.toString() },
  }
}

export function normalizeImports(imports: Import[]): Import[] {
  for (const _import of imports)
    _import.as = _import.as ?? _import.name

  return imports
}

export function resolveIdAbsolute(id: string, parentId?: string) {
  return resolvePathSync(id, {
    url: parentId,
  })
}

function isFilePath(path: string) {
  return path.startsWith('.') || isAbsolute(path) || path.includes('://')
}

/**
 * @deprecated renamed to `stringifyImports`
 */
export const toImports = stringifyImports
