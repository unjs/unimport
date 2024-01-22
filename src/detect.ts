import type MagicString from 'magic-string'
import type { InjectImportsOptions, UnimportContext } from './types'
import { detectImportsRegex } from './detect-regex'

export async function detectImports(
  code: string | MagicString,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
) {
  if (options?.parser === 'acorn')
    return import('./detect-acorn').then(r => r.detectImportsAcorn(code, ctx, options))
  return detectImportsRegex(code, ctx, options)
}
