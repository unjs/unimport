import { Import, Addon } from '../types'
import { toImports } from '../utils'

const contextRE = /\b_ctx\.([\w_$]+)\b/g
const UNREF_KEY = '_unimport_unref_'

export const vueTemplateAddon = (): Addon => ({
  async transform (s) {
    if (!s.original.includes('_ctx.')) {
      return s
    }
    const matches = Array.from(s.original.matchAll(contextRE))
    const imports = await this.getImports()
    const targets: Import[] = []

    for (const match of matches) {
      const name = match[1]
      const item = imports.find(i => i.as === name)
      if (!item) {
        continue
      }

      const start = match.index!
      const end = start + match[0].length

      const tempName = `_unimport_${name}`
      s.overwrite(start, end, `${UNREF_KEY}(${tempName})`)
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
      s.prepend(toImports(targets))
    }

    return s
  },
  async declaration (dts, options) {
    const imports = await this.getImports()
    const items = imports
      .map((i) => {
        const from = options?.resolvePath?.(i) || i.from
        return `readonly ${i.as}: UnwrapRef<typeof import('${from}')${i.name !== '*' ? `['${i.name}']` : ''}>`
      })
      .sort()
    return dts +
`
// for vue template auto import
import { UnwrapRef } from 'vue'
declare module 'vue' {
  interface ComponentCustomProperties {
${items.map(i => '    ' + i).join('\n')}
  }
}
`
  }
})
