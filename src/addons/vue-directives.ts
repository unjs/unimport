import type { Addon, AddonVueDirectivesOptions, Import } from '../types'
import { basename } from 'node:path'
import process from 'node:process'
import { resolve } from 'pathe'
import { camelCase, kebabCase } from 'scule'
import { stringifyImports } from '../utils'

const contextRE = /resolveDirective as _resolveDirective/
const contextText = `${contextRE.source}, `
const directiveRE = /(?:var|const) (\w+) = _resolveDirective\("([\w.-]+)"\);?\s*/g

export const VUE_DIRECTIVES_NAME = 'unimport:vue-directives'

export function vueDirectivesAddon(
  options: AddonVueDirectivesOptions = {},
): Addon {
  function isDirective(importEntry: Import) {
    let isDirective = importEntry.meta?.vueDirective === true
    if (isDirective) {
      return true
    }

    isDirective = options.isDirective?.(normalizePath(process.cwd(), importEntry.from), importEntry) ?? false
    if (isDirective) {
      importEntry.meta ??= {}
      importEntry.meta.vueDirective = true
    }

    return isDirective
  }

  const self = {
    name: VUE_DIRECTIVES_NAME,
    async transform(s, id) {
      if (!s.original.match(contextRE))
        return s

      const matches = Array
        .from(s.original.matchAll(directiveRE))
        .sort((a, b) => b.index - a.index)

      if (!matches.length)
        return s

      let targets: Import[] = []
      for await (
        const [
          begin,
          end,
          importEntry,
        ] of findDirectives(
          isDirective,
          matches,
          this.getImports(),
        )
      ) {
        // remove the directive declaration
        s.overwrite(begin, end, '')
        targets.push(importEntry)
      }

      if (!targets.length)
        return s

      // Remove resolveDirective import only if there are no more directives.
      // User may be using missing directives or globally registered directives.
      if (!s.toString().match(directiveRE))
        s.replace(contextText, '')

      for (const addon of this.addons) {
        if (addon === self)
          continue

        targets = await addon.injectImportsResolved?.call(this, targets, s, id) ?? targets
      }

      let injection = stringifyImports(targets)
      for (const addon of this.addons) {
        if (addon === self)
          continue

        injection = await addon.injectImportsStringified?.call(this, injection, targets, s, id) ?? injection
      }

      s.prepend(injection)

      return s
    },
    async declaration(dts, options) {
      const directivesMap = await this.getImports().then((imports) => {
        return imports.filter(isDirective).reduce((acc, i) => {
          if (i.type || i.dtsDisabled)
            return acc

          let name: string
          if (i.name === 'default' && (i.as === 'default' || !i.as)) {
            const file = basename(i.from)
            const idx = file.indexOf('.')
            name = idx > -1 ? file.slice(0, idx) : file
          }
          else {
            name = i.as ?? i.name
          }
          name = name[0] === 'v' ? camelCase(name) : camelCase(`v-${name}`)
          if (!acc.has(name)) {
            acc.set(name, i)
          }
          return acc
        }, new Map<string, Import>())
      })

      if (!directivesMap.size)
        return dts

      const directives = Array
        .from(directivesMap.entries())
        .map(([name, i]) => `    ${name}: typeof import('${options?.resolvePath?.(i) || i.from}')['${i.name}']`)
        .sort()
        .join('\n')

      return `${dts}
// for vue directives auto import
declare module 'vue' {
  interface ComponentCustomProperties {
${directives}
  }
  interface GlobalDirectives {
${directives}
  }
}`
    },
  } satisfies Addon

  return self
}

function resolvePath(cwd: string, path: string) {
  return path[0] === '.' ? resolve(cwd, path) : path
}

function normalizePath(cwd: string, path: string) {
  return resolvePath(cwd, path).replace(/\\/g, '/')
}

type DirectiveData = [begin: number, end: number, importName: string]
type DirectiveImport = [begin: number, end: number, import: Import]

async function* findDirectives(
  isDirective: (importEntry: Import) => boolean,
  regexArray: RegExpExecArray[],
  importsPromise: Promise<Import[]>,
): AsyncGenerator<DirectiveImport> {
  const imports = (await importsPromise).filter(isDirective)
  if (!imports.length)
    return

  const symbols = regexArray.reduce((acc, regex) => {
    const [all, symbol, resolveDirectiveName] = regex
    if (acc.has(symbol))
      return acc

    acc.set(symbol, [
      regex.index,
      regex.index + all.length,
      kebabCase(resolveDirectiveName),
    ] as const)
    return acc
  }, new Map<string, DirectiveData>())

  for (const [symbol, data] of symbols.entries()) {
    yield * findDirective(imports, symbol, data)
  }
}

function* findDirective(
  imports: Import[],
  symbol: string,
  [begin, end, importName]: DirectiveData,
): Generator<DirectiveImport> {
  let resolvedName: string
  for (const i of imports) {
    if (i.name === 'default' && (i.as === 'default' || !i.as)) {
      const file = basename(i.from)
      const idx = file.indexOf('.')
      resolvedName = kebabCase(idx > -1 ? file.slice(0, idx) : file)
    }
    else {
      resolvedName = kebabCase(i.as ?? i.name)
    }
    if (resolvedName[0] === 'v') {
      resolvedName = resolvedName.slice(resolvedName[1] === '-' ? 2 : 1)
    }
    if (resolvedName === importName) {
      yield [
        begin,
        end,
        { ...i, name: i.name, as: symbol },
      ]
      return
    }
  }
}
