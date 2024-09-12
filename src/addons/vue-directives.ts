import type {
  Addon,
  DirectiveImport,
} from '../types'

const contextRE = /resolveDirective as _resolveDirective/
const directiveRE = /(?:var|const) (\w+) = _resolveDirective\("([\w.-]+)"\);?/g

export function vueDirectivesAddon(directives: DirectiveImport[]): Addon {
  const directivesPromise = Promise.all(directives.map(async (directive) => {
    const { from, directives } = directive
    const resolved = await directives
    return Array.isArray(resolved)
      ? [true, from, new Set(resolved)] as const
      : [false, from, resolved] as const
  })).then((entries) => {
    const map = new Map<string, [from: string, name?: string]>()
    for (const [multiple, from, entry] of entries) {
      if (multiple) {
        for (const directive of entry) {
          map.set(directive.name, [from, directive.as])
        }
      }
      else {
        map.set(entry.name, [from, entry.as])
      }
    }
    return map
  })

  return {
    async transform(s) {
      if (!s.original.includes('_ctx.') || !s.original.match(contextRE))
        return s

      const match = s.original.match(contextRE)
      if (!match)
        return s

      const directivesMap = await directivesPromise
      // We have something like this:
      // var/const _directive_click_outside = _resolveDirective("click-outside");?
      // We need to remove the declaration and replace it with the corresponding import
      // extracting the symbol and the directive name
      const importsMap = new Map<string, string[]>()
      const matches = Array.from(s.original.matchAll(directiveRE)).reduce((acc, regex) => {
        const [all, symbol, name] = regex
        const directiveName = `v-${name}`
        const entry = directivesMap.get(directiveName)
        if (!entry)
          return acc

        const [from, asStmt] = entry
        let set = importsMap.get(from)
        if (!set) {
          set = []
          importsMap.set(from, set)
        }
        // clear the directive declaration
        s.overwrite(
          regex.index,
          regex.index + all.length,
          Array.from({ length: all.length }, () => ' ').join(''),
        )
        set.push(asStmt ? `${asStmt} as ${symbol}` : symbol)
        return acc + 1
      }, 0)

      if (!matches)
        return s

      // TODO: cleanup resolveDirective import

      // inject the imports: check if some module exporting named directives and default one!
      for (const [from, symbols] of importsMap) {
        if (symbols.length > 1) {
          s.append(`import { ${symbols.join(', ')} } from '${from}'\n`)
        }
        else {
          if (symbols[0].includes(' as ')) {
            s.append(`import { ${symbols[0]} } from '${from}'\n`)
          }
          else {
            s.append(`import ${symbols[0]} from '${from}'\n`)
          }
        }
      }

      return s
    },

  } satisfies Addon
}
