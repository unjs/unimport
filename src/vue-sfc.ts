import MagicString from 'magic-string'
import { Unimport } from './context'
import { Import } from './types'
import { toImports, getMagicString } from './utils'

const contextRE = /\b_ctx\.([\w_]+)\b/g

export function vueTemplateAutoImport (code: string | MagicString, ctx: Unimport) {
  const s = getMagicString(code)
  const matches = Array.from(s.original.matchAll(contextRE))
  if (!matches.length) {
    return s
  }

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

  if (targets.length) {
    s.prepend(toImports(targets))
  }

  return s
}
