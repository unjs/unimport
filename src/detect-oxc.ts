import type { Program } from 'estree'
import type MagicString from 'magic-string'
import type { InjectImportsOptions, UnimportContext } from './types'
import { pathToFileURL } from 'node:url'
import { importModule, isPackageExists, resolveModule } from 'local-pkg'
import { createEstreeDetector } from './detect-estree'

type ParseSync = (filename: string, sourceText: string, options?: { sourceType?: 'module' | 'script' } | null) => { program: unknown }

let detectorPromise: ReturnType<typeof loadDetector> | undefined

async function loadDetector() {
  const paths = [import.meta.url]
  let parseSync: ParseSync
  if (isPackageExists('rolldown', { paths })) {
    const resolved = resolveModule('rolldown/utils', { paths })
    const url = resolved ? pathToFileURL(resolved).href : 'rolldown/utils'
    parseSync = (await importModule<{ parseSync: ParseSync }>(url)).parseSync
  }
  else if (isPackageExists('oxc-parser', { paths })) {
    const resolved = resolveModule('oxc-parser', { paths })
    const url = resolved ? pathToFileURL(resolved).href : 'oxc-parser'
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
