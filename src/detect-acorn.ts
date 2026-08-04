import type { Program } from 'estree'
import type MagicString from 'magic-string'
import type { InjectImportsOptions, UnimportContext } from './types'
import { importModule, isPackageExists } from 'local-pkg'
import { createEstreeDetector } from './detect-estree'

type Parse = (code: string, options: { sourceType: 'module', ecmaVersion: 'latest', locations: boolean }) => unknown

let detectorPromise: ReturnType<typeof loadDetector> | undefined

async function loadDetector() {
  if (!isPackageExists('acorn')) {
    throw new Error(
      '[unimport] the `acorn` parser requires `acorn` to be installed.',
    )
  }
  const { parse } = await importModule<{ parse: Parse }>('acorn')
  return createEstreeDetector(code => parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    locations: true,
  }) as Program)
}

export async function detectImportsAcorn(
  code: string | MagicString,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
) {
  detectorPromise ??= loadDetector()
  const detector = await detectorPromise
  return detector(code, ctx, options)
}
