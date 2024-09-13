import type {
  Addon,
  DirectiveImport,
  Import,
} from '../types'
import { stringifyImports } from '../utils'

const contextRE = /resolveDirective as _resolveDirective/
const contextText = `${contextRE.source}, `
const directiveRE = /(?:var|const) (\w+) = _resolveDirective\("([\w.-]+)"\);?\s*/g

type DirectiveDef = [from: string, name?: string]

export function vueDirectivesAddon(directives: DirectiveImport[]): Addon {
  const directivesPromise = Promise.all(directives.map(async (directive) => {
    const { from, directives } = directive
    const resolved = await directives
    return Array.isArray(resolved)
      ? [true, from, new Set(resolved)] as const
      : [false, from, resolved] as const
  })).then((entries) => {
    const map = new Map<string, DirectiveDef>()
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

  const self = {
    async transform(s, id) {
      if (!s.original.includes('_ctx.') || !s.original.match(contextRE))
        return s

      const directivesMap = await directivesPromise
      let targets: Import[] = []
      // We have something like this:
      // var/const _directive_click_outside = _resolveDirective("click-outside");?
      // We need to remove the declaration and replace it with the corresponding import
      // extracting the symbol and the directive name from the declaration
      const matches = Array
        .from(s.original.matchAll(directiveRE))
        .sort((a, b) => b.index - a.index)
        .reduce((acc, regex) => {
          const [all, symbol, name] = regex
          const directiveName = `v-${name}`
          const entry = directivesMap.get(directiveName)
          if (!entry)
            return acc

          const [from, asStmt] = entry
          // remove the directive declaration
          s.overwrite(
            regex.index,
            regex.index + all.length,
            '',
          )
          // add the target import
          if (asStmt) {
            targets.push({
              name: asStmt,
              as: symbol,
              from,
            })
          }
          else {
            // add the directive to the targets
            targets.push({
              name: 'default',
              as: symbol,
              from,
            })
          }
          return acc + 1
        }, 0)

      if (!matches)
        return s

      // remove resolveDirective import
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
  } satisfies Addon

  return self
}
