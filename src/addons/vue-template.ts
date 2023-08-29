import { Import, Addon } from '../types'
import { toImports } from '../utils'

const contextRE = /\b_ctx\.([\w_]+)\b/g
const UNREF_KEY = '__unimport_unref_'

export const vueTemplateAddon = (): Addon => {
  const self: Addon = {
    async transform (s, id) {
      if (!s.original.includes('_ctx.') || s.original.includes(UNREF_KEY)) {
        return s
      }
      const matches = Array.from(s.original.matchAll(contextRE))
      const imports = await this.getImports()
      let targets: Import[] = []

      for (const match of matches) {
        const name = match[1]
        const item = imports.find(i => i.as === name)
        if (!item) {
          continue
        }

        const start = match.index!
        const end = start + match[0].length

        const tempName = `__unimport_${name}`
        s.overwrite(start, end, `(${JSON.stringify(name)} in _ctx ? _ctx.${name} : ${UNREF_KEY}(${tempName}))`)
        if (!targets.find(i => i.as === tempName)) {
          targets.push({
            ...item,
            as: tempName
          })
        }
      }

      if (targets.length) {
        targets.push({
          name: 'unref',
          from: 'vue',
          as: UNREF_KEY
        })

        for (const addon of this.addons) {
          if (addon === self) {
            continue
          }
          targets = await addon.injectImportsResolved?.call(this, targets, s, id) ?? targets
        }

        let injection = toImports(targets)
        for (const addon of this.addons) {
          if (addon === self) {
            continue
          }
          injection = await addon.injectImportsStringified?.call(this, injection, targets, s, id) ?? injection
        }

        s.prepend(injection)
      }

      return s
    },
    async declaration (dts, options) {
      const imports = await this.getImports()
      const items = imports
        .map((i) => {
          if (i.type) { return '' }
          const from = options?.resolvePath?.(i) || i.from
          return `readonly ${i.as}: UnwrapRef<typeof import('${from}')${i.name !== '*' ? `['${i.name}']` : ''}>`
        })
        .filter(Boolean)
        .sort()

      const extendItems = items.map(i => '    ' + i).join('\n')
      return dts +
`
// for vue template auto import
import { UnwrapRef } from 'vue'
declare module 'vue' {
  interface ComponentCustomProperties {
${extendItems}
  }
}` + // Workaround for Vue 3.3
`
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
${extendItems}
  }
}
`
    }
  }

  return self
}
