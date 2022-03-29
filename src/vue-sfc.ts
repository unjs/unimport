import MagicString from 'magic-string'
import { Unimport } from './context'
import { Import } from './types'
import { toImports } from './utils'

const contextRE = /\b_ctx\.([\w_]+)\b/g

export function vueTemplateAutoImport (code: string, ctx: Unimport) {
  const matches = Array.from(code.matchAll(contextRE))
  const s = new MagicString(code)

  const imports = ctx.getImports()
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

  s.prepend(toImports(targets))

  return s.toString()
}
