import type { NativeInject, UnimportContext } from './types'
import escapeRE from 'escape-string-regexp'
import { VUE_DIRECTIVES_NAME } from './addons/vue-directives'
import { VUE_TEMPLATE_NAME } from './addons/vue-template'

/**
 * Builds a map for Rolldown's `transform.inject` from the auto-imports.
 *
 * Returns `undefined` when the options need the JS transform for every module.
 */
export async function getNativeInject(ctx: UnimportContext): Promise<NativeInject | undefined> {
  if (ctx.options.resolveId)
    return

  const triggers: string[] = []
  for (const addon of ctx.addons) {
    if (addon.matchImports || addon.injectImportsResolved || addon.injectImportsStringified)
      return
    if (!addon.transform)
      continue
    if (addon.name === VUE_TEMPLATE_NAME)
      triggers.push('_ctx\\.')
    else if (addon.name === VUE_DIRECTIVES_NAME)
      triggers.push('resolveDirective as _resolveDirective')
    else
      return
  }

  for (const name of ctx.options.virtualImports || [])
    triggers.push(escapeRE(name))

  const inject: NativeInject['inject'] = {}
  const skipped: string[] = []
  for (const i of await ctx.getImports()) {
    if (i.type)
      continue
    const as = i.as ?? i.name
    if (i.with) {
      skipped.push(as)
      continue
    }
    inject[as] = i.name === 'default' || i.name === '=' ? i.from : [i.from, i.name]
  }

  if (skipped.length)
    triggers.push(`(?:^|[^\\w$.])(?:${skipped.map(n => escapeRE(n)).join('|')})(?:[^\\w$]|$)`)

  return {
    inject,
    transformFilter: triggers.length ? new RegExp(triggers.join('|')) : undefined,
  }
}
