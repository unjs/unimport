import { findStaticImports, parseStaticImport, StaticImport } from 'mlly'
import MagicString from 'magic-string'
import type { Import, Preset, TypeDeclrationOptions } from './types'

export const excludeRE = [
  // imported from other module
  /\bimport\s*(.+?)\s*from\b/gs,
  // defined as function
  /\bfunction\s*([\w_$]+?)\s*\(/gs,
  // defined as class
  /\bclass\s*([\w_$]+?)\s*{/gs,
  // defined as local variable
  /\b(?:const|let|var)\s+?(\[.*?\]|\{.*?\}|.+?)\s*?[=;\n]/gs
]

export const importAsRE = /^.*\sas\s+/
export const separatorRE = /[,[\]{}\n]/g
export const matchRE = /(?<![\w_$/)]\.)([\w_$]+)\s*(?:[.()[\];+*&|`<>,\n-])/g

const regexRE = /\/.*?(?<!\\)(?<!\[[^\]]*)\/[gimsuy]*/g
const multilineCommentsRE = /\/\*\s(.|[\r\n])*?\*\//gm
const singlelineCommentsRE = /\/\/\s.*$/gm
const templateLiteralRE = /\$\{\s*(.*?)\s*\}/g
const quotesRE = [
  /(["'])((?:\\\1|(?!\1)|.|\r)*?)\1/gm,
  /([`])((?:\\\1|(?!\1)|.|\n|\r)*?)\1/gm
]

export function defineUnimportPreset (preset: Preset): Preset {
  return preset
}

export function stripCommentsAndStrings (code: string) {
  return code
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
    .replace(templateLiteralRE, '` + $1 + `')
    .replace(regexRE, 'new RegExp("")')
    .replace(quotesRE[0], '""')
    .replace(quotesRE[1], '``')
}

export function toImports (imports: Import[], isCJS = false) {
  const map = toImportModuleMap(imports)
  return Object.entries(map)
    .flatMap(([name, importSet]) => {
      const entries = []
      const imports = Array.from(importSet)
        .filter((i) => {
          // handle special imports
          if (!i.name || i.as === '') {
            entries.push(
              isCJS
                ? `require('${name}');`
                : `import '${name}';`
            )
            return false
          } else if (i.name === 'default') {
            entries.push(
              isCJS
                ? `const { default: ${i.as} } = require('${name}');`
                : `import ${i.as} from '${name}';`
            )
            return false
          } else if (i.name === '*') {
            entries.push(
              isCJS
                ? `const ${i.as} = require('${name}');`
                : `import * as ${i.as} from '${name}';`
            )
            return false
          }

          return true
        })

      if (imports.length) {
        const importsAs = imports.map(i => stringifyImportAlias(i, isCJS))
        entries.push(
          isCJS
            ? `const { ${importsAs.join(', ')} } = require('${name}');`
            : `import { ${importsAs.join(', ')} } from '${name}';`
        )
      }

      return entries
    })
    .join('\n')
}

export function dedupeImports (imports: Import[], warn: (msg: string) => void) {
  const map = new Map<string, number>()
  const indexToRemove = new Set<number>()

  imports.filter(i => !i.disabled).forEach((i, idx) => {
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
    if (diff === 0) {
      warn(`Duplicated imports "${name}", the one from "${other.from}" has been ignored`)
    }
    if (diff <= 0) {
      indexToRemove.add(map.get(name)!)
      map.set(name, idx)
    } else {
      indexToRemove.add(idx)
    }
  })

  return imports.filter((_, idx) => !indexToRemove.has(idx))
}

export function toExports (imports: Import[]) {
  const map = toImportModuleMap(imports)
  return Object.entries(map)
    .flatMap(([name, imports]) => {
      name = name.replace(/\.[a-z]+$/, '')
      const entries: string[] = []
      const filtered = Array.from(imports).filter((i) => {
        if (i.name === '*') {
          entries.push(`export * as ${i.as} from '${name}';`)
          return false
        }
        return true
      })
      if (filtered.length) {
        entries.push(`export { ${filtered.map(i => stringifyImportAlias(i, false)).join(', ')} } from '${name}';`)
      }
      return entries
    })
    .join('\n')
}

export function toTypeDeclrationItems (imports: Import[], options?: TypeDeclrationOptions) {
  return imports
    .map((i) => {
      const from = options?.resolvePath?.(i) || i.from
      return `const ${i.as}: typeof import('${from}')${i.name !== '*' ? `['${i.name}']` : ''}`
    })
    .sort()
}

export function toTypeDeclrationFile (imports: Import[], options?: TypeDeclrationOptions) {
  const items = toTypeDeclrationItems(imports, options)
  const {
    exportHelper = true
  } = options || {}

  let declration = ''
  if (exportHelper) {
    declration += 'export {}\n'
  }
  declration += 'declare global {\n' + items.map(i => '  ' + i).join('\n') + '\n}'
  return declration
}

function stringifyImportAlias (item: Import, isCJS = false) {
  return (item.as === undefined || item.name === item.as)
    ? item.name
    : isCJS
      ? `${item.name}: ${item.as}`
      : `${item.name} as ${item.as}`
}

function toImportModuleMap (imports: Import[]) {
  const map: Record<string, Set<Import>> = {}
  for (const _import of imports) {
    if (!map[_import.from]) {
      map[_import.from] = new Set()
    }
    map[_import.from].add(_import)
  }
  return map
}

export function getString (code:string | MagicString) {
  if (typeof code === 'string') {
    return code
  }
  return code.toString()
}

export function getMagicString (code:string | MagicString) {
  if (typeof code === 'string') {
    return new MagicString(code)
  }
  return code
}

export function addImportToCode (code: string | MagicString, imports: Import[], isCJS = false, mergeExisting = false) {
  let newImports: Import[] = []
  const s = getMagicString(code)

  if (mergeExisting && !isCJS) {
    const existing = findStaticImports(s.original).map(i => parseStaticImport(i))
    const map = new Map<StaticImport, Import[]>()

    imports.forEach((i) => {
      const target = existing.find(e => e.specifier === i.from && e.imports.startsWith('{'))
      if (!target) {
        return newImports.push(i)
      }
      if (!map.has(target)) {
        map.set(target, [])
      }
      map.get(target)!.push(i)
    })

    for (const [target, items] of map.entries()) {
      const strings = items.map(i => stringifyImportAlias(i) + ', ')
      const importLength = target.code.match(/^\s*import\s*{/)?.[0]?.length
      if (importLength) {
        s.appendLeft(target.start + importLength, ' ' + strings.join('').trim())
      }
    }
  } else {
    newImports = imports
  }

  const newEntries = toImports(newImports, isCJS)
  if (newEntries) {
    s.prepend(newEntries + '\n')
  }

  return {
    s,
    code: s.toString()
  }
}

export function normalizeImports (imports: Import[]): Import[] {
  for (const _import of imports) {
    _import.as = _import.as ?? _import.name
  }
  return imports
}
