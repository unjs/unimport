import type { Program } from 'estree'
import { parseSync } from 'oxc-parser'
import { createEstreeDetector } from './detect-estree'

export const detectImportsOxc = createEstreeDetector(
  code => parseSync('', code, {
    sourceType: 'module',
  }).program as Program,
)
