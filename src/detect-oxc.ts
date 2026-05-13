import type { Program } from 'estree'
import type MagicString from 'magic-string'
import type { InjectImportsOptions, UnimportContext } from './types'
import { importModule, isPackageExists } from 'local-pkg'
import { createEstreeDetector } from './detect-estree'

type ParseSync = (filename: string, sourceText: string, options?: { sourceType?: 'module' | 'script' } | null) => { program: unknown }

let detectorPromise: ReturnType<typeof loadDetector> | undefined

async function loadDetector() {
  let parseSync: ParseSync
  if (isPackageExists('rolldown')) {
    parseSync = (await importModule<{ parseSync: ParseSync }>('rolldown/utils')).parseSync
  }
  else if (isPackageExists('oxc-parser')) {
    parseSync = (await importModule<{ parseSync: ParseSync }>('oxc-parser')).parseSync
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
