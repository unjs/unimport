/* eslint-disable spaced-comment */
import { isAbsolute, relative } from 'pathe'
import { findStaticImports, parseStaticImport, StaticImport, resolvePath } from 'mlly'
import MagicString from 'magic-string'
import { stripLiteral } from 'strip-literal'
import type { Import, InlinePreset, MagicStringResult, TypeDeclarationOptions } from './types'
import fs from "fs"
import ts from "typescript"
export const excludeRE = [
  // imported/exported from other module
  /\b(import|export)\b([\s\w_$*{},]+)\sfrom\b/gs,
  // defined as function
  /\bfunction\s*([\w_$]+?)\s*\(/gs,
  // defined as class
  /\bclass\s*([\w_$]+?)\s*{/gs,
  // defined as local variable
  /\b(?:const|let|var)\s+?(\[.*?\]|\{.*?\}|.+?)\s*?[=;\n]/gs
]

export const importAsRE = /^.*\sas\s+/
export const separatorRE = /[,[\]{}\n]|\bimport\b/g

/**                                                           |       |
 *                    destructing   case&ternary    non-call  |  id   |
 *                         ↓             ↓             ↓      |       |*/
export const matchRE = /(^|\.\.\.|(?:\bcase|\?)\s+|[^\w_$\/)])([\w_$]+)\s*(?=[.()[\]}:;?+\-*&|`<>,\n]|\b(?:instanceof|in)\b|$)/g

const regexRE = /\/[^\s]*?(?<!\\)(?<!\[[^\]]*)\/[gimsuy]*/g

export function stripCommentsAndStrings (code: string) {
  return stripLiteral(code)
    .replace(regexRE, 'new RegExp("")')
}

export function defineUnimportPreset (preset: InlinePreset): InlinePreset {
  return preset
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

export function toExports (imports: Import[], fileDir?: string) {
  const map = toImportModuleMap(imports)
  return Object.entries(map)
    .flatMap(([name, imports]) => {
      name = name.replace(/\.[a-z]+$/, '')
      if (fileDir && isAbsolute(name)) {
        name = relative(fileDir, name)
        if (!name.match(/^[.\/]/)) {
          name = './' + name
        }
      }
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
export function extractJSDoc(modulePath: string, functionName: string) {
  try{
    if(modulePath.indexOf("../../")!==-1){
      modulePath=modulePath.slice(6)
      modulePath=fs.existsSync(modulePath+".d.ts") ? modulePath+".d.ts" : modulePath+"/index.d.ts"
    }
    if(modulePath.indexOf("vue-router")!==-1){
      modulePath=".nuxt/vue-router.d.ts"
    }
    if(modulePath.indexOf("/")===-1 || modulePath.indexOf("@")!==-1){
      modulePath=(modulePath.indexOf("node_modules")===-1?"node_modules/":"")+modulePath+(modulePath.indexOf("i18n")===-1? "/dist/"+( modulePath==="vue" ? modulePath+".d.ts": "index.d.ts"): '')
    }
    if(modulePath.indexOf("/node_modules")!==-1){
      modulePath=modulePath.slice(modulePath.indexOf("/node_modules")+1)
      modulePath=fs.existsSync(modulePath+".d.ts") ? modulePath+".d.ts" : modulePath+"/index.d.ts"
    }
    const sourceCode = fs.readFileSync(modulePath, 'utf8');

    const sourceFile = ts.createSourceFile("temp.ts", sourceCode, ts.ScriptTarget.ES2015, true);

    let jsDoc;
    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name && node.name.text === functionName) {
        
        if (node.jsDoc && node.jsDoc.length > 0) {
          const comment = node.jsDoc[0].getText(sourceFile);
          jsDoc = comment;
        }
      }

      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return jsDoc;
  }
  catch (err){
    return console.error("Error encountered while obtaining the JSDoc: "+err)
  }
}

export function toTypeDeclarationItems (imports: Import[], options?: TypeDeclarationOptions) {
  return imports.map((i) => {
    const from = (options?.resolvePath?.(i) || i.from).replace(/\.ts$/, "");
    return `${extractJSDoc(from, i.as)}\n\tconst ${i.as}: typeof import('${from}')${i.name !== "*" ? `['${i.name}']` : ""}`;
  }).sort();
}

export function toTypeDeclarationFile (imports: Import[], options?: TypeDeclarationOptions) {
  const items = toTypeDeclarationItems(imports, options)
  const {
    exportHelper = true
  } = options || {}

  let declaration = ''
  if (exportHelper) {
    declaration += 'export {}\n'
  }
  declaration += 'declare global {\n' + items.map(i => '  ' + i).join('\n') + '\n}'
  return declaration
}

export function toTypeReExports (imports: Import[], options?: TypeDeclarationOptions) {
  const importsMap = new Map<string, Import[]>()
  imports.forEach((i) => {
    const from = options?.resolvePath?.(i) || i.from
    const list = importsMap.get(from) || []
    list.push(i)
    importsMap.set(from, list)
  })

  const code = Array.from(importsMap.entries()).flatMap(([from, imports]) => {
    const names = imports.map((i) => {
      let name = i.name === '*' ? 'default' : i.name
      if (i.as && i.as !== name) {
        name += ` as ${i.as}`
      }
      return name
    })
    return [
      '// @ts-ignore',
      `export type { ${names.join(', ')} } from '${from}'`
    ]
  })
  return '// for type re-export\ndeclare global {\n' + code.map(i => '  ' + i).join('\n') + '\n}'
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
    if (_import.type) {
      continue
    }
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

export function addImportToCode (
  code: string | MagicString,
  imports: Import[],
  isCJS = false,
  mergeExisting = false,
  injectAtLast = false,
  firstOccurrence = Infinity
): MagicStringResult {
  let newImports: Import[] = []
  const s = getMagicString(code)

  let _staticImports: StaticImport[] | undefined
  function findStaticImportsLazy () {
    if (!_staticImports) {
      _staticImports = findStaticImports(s.original).map(i => parseStaticImport(i))
    }
    return _staticImports
  }

  if (mergeExisting && !isCJS) {
    const existingImports = findStaticImportsLazy()
    const map = new Map<StaticImport, Import[]>()

    imports.forEach((i) => {
      const target = existingImports.find(e => e.specifier === i.from && e.imports.startsWith('{'))
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
    const insertionIndex = injectAtLast
      ? findStaticImportsLazy().reverse().find(i => i.end <= firstOccurrence)?.end ?? 0
      : 0

    if (insertionIndex === 0) {
      s.prepend(newEntries + '\n')
    } else {
      s.appendRight(insertionIndex, '\n' + newEntries + '\n')
    }
  }

  return {
    s,
    get code () { return s.toString() }
  }
}

export function normalizeImports (imports: Import[]): Import[] {
  for (const _import of imports) {
    _import.as = _import.as ?? _import.name
  }
  return imports
}

export function resolveIdAbsolute (id: string, parentId?: string) {
  return resolvePath(id, {
    url: parentId
  })
}
