import type {
  Addon,
  DirectiveImport,
  DirectivePreset,
  Import,
} from '../types'

import { stringifyImports } from '../utils'

const contextRE = /resolveDirective as _resolveDirective/
const contextText = `${contextRE.source}, `
const directiveRE = /(?:var|const) (\w+) = _resolveDirective\("([\w.-]+)"\);?\s*/g

type DirectiveType = [directive: DirectiveImport, preset: DirectivePreset]

export function vueDirectivesAddon(directives: DirectivePreset[]): Addon {
  const directivesArray = Array.isArray(directives) ? directives : [directives]
  const directivesPromise = Promise
    .all(directivesArray.map(async (preset) => {
      const directives = await preset.directives
      return [preset, directives] as const
    }))
    .then((entries) => {
      const map = new Map<string, DirectiveType>()
      for (const [preset, directive] of entries) {
        if (Array.isArray(directive)) {
          for (const entry of directive) {
            map.set(entry.directive, [entry, preset])
          }
        }
        else {
          map.set(directive.directive, [directive, preset])
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

          const [directive, preset] = entry
          const importName = directive.name
          const asStmt = directive.as
          // remove the directive declaration
          s.overwrite(
            regex.index,
            regex.index + all.length,
            '',
          )
          if (importName !== 'default') {
            // add named import
            targets.push({
              ...preset,
              name: asStmt ?? importName,
              as: symbol,
            })
          }
          else {
            // add default export
            targets.push({
              ...preset,
              name: 'default',
              as: symbol,
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
