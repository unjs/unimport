import MagicString from 'magic-string'
import { UnimportContext, Import, Addon } from '../types'
import { toImports, getMagicString } from '../utils'

const contextRE = /\b_ctx\.([\w_]+)\b/g

const vueTemplateAddon: Addon = {
  transform (code: string | MagicString, ctx: UnimportContext) {
    const s = getMagicString(code)
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
  decleration (dts:string) {
    return dts
  }
}

export default vueTemplateAddon
