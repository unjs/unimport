import type { Program } from 'oxc-parser'
import { parse } from 'acorn'
import { createEstreeDetector } from './detect-estree'

export const detectImportsAcorn = createEstreeDetector(
  code => parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    locations: true,
  }) as Program,
)
