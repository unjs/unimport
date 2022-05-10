import { Import, Addon } from '../types'
import { toImports, toTypeDeclrationItems } from '../utils'

const contextRE = /\b_ctx\.([\w_]+)\b/g

const vueTemplateAddon: Addon = {
  transform (s, _, ctx) {
    if (!s.original.includes('_ctx.')) {
      return s
    }
    const matches = Array.from(s.original.matchAll(contextRE))
    if (!matches.length) {
      return s
    }

    const imports = ctx.imports
    const targets: Import[] = []

    for (const match of matches) {
      const name = match[1]
      const item = imports.find(i => i.as === name)
      if (!item) {
        continue
      }

      const start = match.index!
      const end = start + match[0].length

      const tempName = '__unimport_' + name
      s.overwrite(start, end, tempName)
      if (!targets.find(i => i.as === tempName)) {
        targets.push({
          ...item,
          as: tempName
        })
      }
    }

    if (targets.length) {
      s.prepend(toImports(targets))
    }

    return s
  },
  decleration (dts, ctx, options) {
    const items = toTypeDeclrationItems(ctx.imports, options)
      .map(i => i.replace('const ', ''))
    return dts +
`
// for vue template auto import
declare module 'vue' {
  interface ComponentCustomProperties {
${items.map(i => '    ' + i).join('\n')}
  }
}
`
  }
}

export default vueTemplateAddon
