import type { Import } from './types'

export const excludeRE = [
  // imported from other module
  /\bimport\s*([\s\S]+?)\s*from\b/g,
  // defined as function
  /\bfunction\s*([\w_$]+?)\s*\(/g,
  // defined as local variable
  /\b(?:const|let|var)\s+?(\[[\s\S]*?\]|\{[\s\S]*?\}|[\s\S]+?)\s*?[=;\n]/g
]

export const importAsRE = /^.*\sas\s+/
export const separatorRE = /[,[\]{}\n]/g
const multilineCommentsRE = /\/\*\s(.|[\r\n])*?\*\//gm
const singlelineCommentsRE = /\/\/\s.*$/gm
const templateLiteralRE = /\$\{(.*)\}/g
const quotesRE = [
  /(["'])((?:\\\1|(?!\1)|.|\r)*?)\1/gm,
  /([`])((?:\\\1|(?!\1)|.|\n|\r)*?)\1/gm
]

export function stripCommentsAndStrings (code: string) {
  return code
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
    .replace(templateLiteralRE, '` + $1 + `')
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
          if (i.name === 'default') {
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

export function toExports (imports: Import[]) {
  const map = toImportModuleMap(imports)
  return Object.entries(map)
    .map(([name, imports]) => `export { ${Array.from(imports).map(i => stringifyImportAlias(i, false)).join(', ')} } from '${name}';`)
    .join('\n')
}

function stringifyImportAlias (item: Import, isCJS = false) {
  return item.name === item.as
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
