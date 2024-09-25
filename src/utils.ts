import type { StaticImport } from 'mlly'
import type { Import, InlinePreset, MagicStringResult, PathFromResolver, TypeDeclarationOptions } from './types'
import MagicString from 'magic-string'
import { findStaticImports, parseStaticImport, resolvePath } from 'mlly'
import { isAbsolute, relative } from 'pathe'
import { stripCommentsAndStrings } from './regexp'

export function defineUnimportPreset(preset: InlinePreset): InlinePreset {
  return preset
}

const safePropertyName = /^[a-z$_][\w$]*$/i

function stringifyWith(withValues: Record<string, string>) {
  let withDefs = ''
  for (let entries = Object.entries(withValues), l = entries.length, i = 0; i < l; i++) {
    const [prop, value] = entries[i]
    withDefs += safePropertyName.test(prop) ? prop : JSON.stringify(prop)
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

export function dedupeImports(imports: Import[], warn: (msg: string) => void) {
  const map = new Map<string, number>()
  const indexToRemove = new Set<number>()

  imports.filter(i => !i.disabled).forEach((i, idx) => {
    if (i.declarationType === 'enum')
      return

    const name = i.as ?? i.name
    if (!map.has(name)) {
      map.set(name, idx)
      return
    }

    const other = imports[map.get(name)!]

    if (other.from === i.from) {
      indexToRemove.add(idx)
      return
    }
    const diff = (other.priority || 1) - (i.priority || 1)
    if (diff === 0)
      warn(`Duplicated imports "${name}", the one from "${other.from}" has been ignored and "${i.from}" is used`)

    if (diff <= 0) {
      indexToRemove.add(map.get(name)!)
      map.set(name, idx)
    }
    else {
      indexToRemove.add(idx)
    }
  })

  return imports.filter((_, idx) => !indexToRemove.has(idx))
}

export function toExports(imports: Import[], fileDir?: string, includeType = false) {
  const map = toImportModuleMap(imports, includeType)
  return Object.entries(map)
    .flatMap(([name, imports]) => {
      if (isFilePath(name))
        name = name.replace(/\.[a-z]+$/i, '')

      if (fileDir && isAbsolute(name)) {
        name = relative(fileDir, name)
        if (!name.match(/^[./]/))
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
      if (filtered.length)
        entries.push(`export { ${filtered.map(i => stringifyImportAlias(i, false)).join(', ')} } from '${name}';`)

      return entries
    })
    .join('\n')
}

export function stripFileExtension(path: string) {
  return path.replace(/\.[a-z]+$/i, '')
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
        typeDef += `['${i.name}']`

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

function toImportModuleMap(imports: Import[], includeType = false) {
  const map: Record<string, Set<Import>> = {}
  for (const _import of imports) {
    if (_import.type && !includeType)
      continue

    if (!map[_import.from])
      map[_import.from] = new Set()

    map[_import.from].add(_import)
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
    const shebangRegex = /^#!.+/
    return shebangRegex.test(s.original)
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
      const importLength = target.code.match(/^\s*import\s*\{/)?.[0]?.length
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
  return resolvePath(id, {
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
