import type { Program } from 'estree'
import type MagicString from 'magic-string'
import type { InjectImportsOptions, UnimportContext } from './types'
import { importModule, isPackageExists, resolveModule } from 'local-pkg'
import { createEstreeDetector } from './detect-estree'

type ParseSync = (filename: string, sourceText: string, options?: { sourceType?: 'module' | 'script' } | null) => { program: unknown }

let detectorPromise: ReturnType<typeof loadDetector> | undefined

async function loadDetector() {
  const paths = [import.meta.url]
  let parseSync: ParseSync
  if (isPackageExists('rolldown', { paths })) {
    const url = resolveModule('rolldown/utils', { paths }) ?? 'rolldown/utils'
    parseSync = (await importModule<{ parseSync: ParseSync }>(url)).parseSync
  }
  else if (isPackageExists('oxc-parser', { paths })) {
    const url = resolveModule('oxc-parser', { paths }) ?? 'oxc-parser'
    parseSync = (await importModule<{ parseSync: ParseSync }>(url)).parseSync
  }
  else {
    throw new Error(
      '[unimport] the `oxc` parser requires either `rolldown` or `oxc-parser` to be installed.',
    )
  }
  return createEstreeDetector(code => parseSync('', code, { sourceType: 'module' }).program as Program)
}

export async function detectImportsOxc(
  code: string | MagicString,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
) {
  detectorPromise ??= loadDetector()
  const detector = await detectorPromise
  return detector(code, ctx, options)
}
