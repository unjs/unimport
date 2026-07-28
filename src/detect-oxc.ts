import type MagicString from 'magic-string'
import type { parseSync as oxcParseSync } from 'oxc-parser'
import type { InjectImportsOptions, UnimportContext } from './types'
import { pathToFileURL } from 'node:url'
import { importModule, isPackageExists, resolveModule } from 'local-pkg'
import { createEstreeDetector } from './detect-estree'

let detectorPromise: ReturnType<typeof loadDetector> | undefined

async function loadDetector() {
  const paths = [import.meta.url]
  let parseSync: typeof oxcParseSync
  if (isPackageExists('rolldown', { paths })) {
    const resolved = resolveModule('rolldown/utils', { paths })
    const url = resolved ? pathToFileURL(resolved).href : 'rolldown/utils'
    parseSync = (await importModule<{ parseSync: typeof oxcParseSync }>(url)).parseSync
  }
  else if (isPackageExists('oxc-parser', { paths })) {
    const resolved = resolveModule('oxc-parser', { paths })
    const url = resolved ? pathToFileURL(resolved).href : 'oxc-parser'
    parseSync = (await importModule<{ parseSync: typeof oxcParseSync }>(url)).parseSync
  }
  else {
    throw new Error(
      '[unimport] the `oxc` parser requires either `rolldown` or `oxc-parser` to be installed.',
    )
  }
  return createEstreeDetector(code => parseSync('', code, { sourceType: 'module' }).program)
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
