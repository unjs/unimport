import { detectSyntax } from 'mlly'
import escapeRE from 'escape-string-regexp'
import type { Import, UnimportOptions } from './types'
import { excludeRE, stripCommentsAndStrings, separatorRE, importAsRE, toTypeDeclrationFile, addImportToCode, dedupeImports } from './utils'
import { resolveBuiltinPresets } from './preset'
export * from './types'

interface Context {
  imports: Import[]
  matchRE: RegExp
  map: Map<string, Import>
}

export type Unimport = ReturnType<typeof createUnimport>

export function createUnimport (opts: Partial<UnimportOptions>) {
  const ctx: Context = {
    imports: [].concat(opts.imports).filter(Boolean),
    map: new Map(),
    matchRE: /__never__/g
  }

  // Resolve presets
  ctx.imports.push(...resolveBuiltinPresets(opts.presets || []))

  // Normalize imports
  for (const _import of ctx.imports) {
    _import.as = _import.as || _import.name
  }

  // Detect duplicates
  ctx.imports = dedupeImports(ctx.imports, console.warn)

  // Create regex
  ctx.matchRE = new RegExp(`(?:\\b|^)(${ctx.imports.map(i => escapeRE(i.as)).join('|')})(?:\\b|\\()`, 'g')

  // Create map
  for (const _import of ctx.imports) {
    ctx.map.set(_import.as, _import)
  }

  return {
    detectImports: (code: string) => detectImports(code, ctx),
    addImports: (code: string, mergeExisting?: boolean) => addImports(code, ctx, mergeExisting),
    generateTypeDecarations: () => toTypeDeclrationFile(ctx.imports)
  }
}

function detectImports (code: string, ctx: Context) {
  // Strip comments so we don't match on them
  const strippedCode = stripCommentsAndStrings(code)
  const isCJSContext = detectSyntax(strippedCode).hasCJS

  // Find all possible injection
  const matched = new Set(
    Array.from(strippedCode.matchAll(ctx.matchRE)).map(i => i[1])
  )

  // Remove those already defined
  for (const regex of excludeRE) {
    Array.from(strippedCode.matchAll(regex))
      .flatMap(i => [
        ...(i[1]?.split(separatorRE) || []),
        ...(i[2]?.split(separatorRE) || [])
      ])
      .map(i => i.replace(importAsRE, '').trim())
      .forEach(i => matched.delete(i))
  }

  const matchedImports = Array.from(matched)
    .map(name => ctx.map.get(name))
    .filter(Boolean)

  return {
    strippedCode,
    isCJSContext,
    matchedImports
  }
}

function addImports (code: string, ctx: Context, mergeExisting?: boolean) {
  const { isCJSContext, matchedImports } = detectImports(code, ctx)

  return addImportToCode(code, matchedImports, isCJSContext, mergeExisting)
}
