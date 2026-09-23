import type MagicString from 'magic-string'
import type { InjectImportsOptions, UnimportContext } from './types'
import { detectImportsRegex } from './detect-regex'

export async function detectImports(
  code: string | MagicString,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
  id?: string,
) {
  switch (options?.parser) {
    case 'acorn':
      return import('./detect-acorn').then(r => r.detectImportsAcorn(code, ctx, options, id))
    case 'oxc':
      return import('./detect-oxc').then(r => r.detectImportsOxc(code, ctx, options, id))
    default:
      return detectImportsRegex(code, ctx, options)
  }
}
