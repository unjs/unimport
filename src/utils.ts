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
  const map = toImportModuleMap(imports, isCJS)
  if (isCJS) {
    return Object.entries(map)
      .map(([name, imports]) => `const { ${Array.from(imports).join(', ')} } = require('${name}');`)
      .join('\n')
  } else {
    return Object.entries(map)
      .map(([name, imports]) => `import { ${Array.from(imports).join(', ')} } from '${name}';`)
      .join('\n')
  }
}

export function toExports (imports: Import[]) {
  const map = toImportModuleMap(imports, false)
  return Object.entries(map)
    .map(([name, imports]) => `export { ${Array.from(imports).join(', ')} } from '${name}';`)
    .join('\n')
}

function toImportModuleMap (imports: Import[], isCJS = false) {
  const aliasKeyword = isCJS ? ' : ' : ' as '
  const map: Record<string, Set<string>> = {}
  for (const _import of imports) {
    if (!map[_import.from]) {
      map[_import.from] = new Set()
    }
    map[_import.from].add(
      _import.name === _import.as
        ? _import.name
        : _import.name + aliasKeyword + _import.as
    )
  }
  return map
}
