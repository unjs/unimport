import type { Addon, Import } from '../types'
import { stringifyImports, toTypeDeclarationItems } from '../utils'

const contextRE = /\b_ctx\.([$\w]+)\b/g
const UNREF_KEY = '__unimport_unref_'

export const VUE_TEMPLATE_NAME = 'unimport:vue-template'

export function vueTemplateAddon(): Addon {
  const self: Addon = {
    name: VUE_TEMPLATE_NAME,
    async transform(s, id) {
      if (!s.original.includes('_ctx.') || s.original.includes(UNREF_KEY))
        return s

      const matches = Array.from(s.original.matchAll(contextRE))
      const imports = await this.getImports()
      let targets: Import[] = []

      for (const match of matches) {
        const name = match[1]
        const item = imports.find(i => i.as === name)
        if (!item)
          continue

        const start = match.index!
        const end = start + match[0].length

        const tempName = `__unimport_${name}`
        s.overwrite(start, end, `(${JSON.stringify(name)} in _ctx ? _ctx.${name} : ${UNREF_KEY}(${tempName}))`)
        if (!targets.find(i => i.as === tempName)) {
          targets.push({
            ...item,
            as: tempName,
          })
        }
      }

      if (targets.length) {
        targets.push({
          name: 'unref',
          from: 'vue',
          as: UNREF_KEY,
        })

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
      }

      return s
    },
    async declaration(dts, options) {
      const imports = await this.getImports()
      const items = toTypeDeclarationItems(imports.filter(i => !i.type && !i.dtsDisabled), options)

      const extendItems = items.map(i => `  ${i}`).join('\n')
      return `${dts}
// for vue template auto import
type UnwrapRefs<T> = {
  [K in keyof T]: import('vue').UnwrapRef<T[K]>
}
namespace _ComponentCustomProperties {
${extendItems}
}
declare module 'vue' {
  interface ComponentCustomProperties extends UnwrapRefs<typeof _ComponentCustomProperties> {}
}`
    },
  }

  return self
}
