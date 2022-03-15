import { detectSyntax } from 'mlly'
import escapeRE from 'escape-string-regexp'
import type { Import, TypeDeclrationOptions, UnimportOptions } from './types'
import { excludeRE, stripCommentsAndStrings, separatorRE, importAsRE, toTypeDeclrationFile, addImportToCode, dedupeImports, toExports, normalizeImports } from './utils'
import { resolveBuiltinPresets } from './preset'

interface Context {
  readonly imports: Import[]
  staticImports: Import[]
  dynamicImports: Import[]
  matchRE: RegExp
  map: Map<string, Import>
}

export type Unimport = ReturnType<typeof createUnimport>

export function createUnimport (opts: Partial<UnimportOptions>) {
  // Cache for combine imports
  let _combinedImports: Import[] | undefined

  const ctx: Context = {
    staticImports: [].concat(opts.imports).filter(Boolean),
    dynamicImports: [],
    get imports () {
      if (!_combinedImports) {
        _combinedImports = reload()
      }
      return _combinedImports
    },
    map: new Map(),
    matchRE: /__never__/g
  }

  // Resolve presets
  ctx.staticImports.push(...resolveBuiltinPresets(opts.presets || []))

  function reload () {
    // Combine static and dynamic imports
    // eslint-disable-next-line no-console
    const imports = normalizeImports(dedupeImports([...ctx.staticImports, ...ctx.dynamicImports], opts.warn || console.warn))

    // Create regex
    ctx.matchRE = new RegExp(`(?:\\b|^)(${imports.map(i => escapeRE(i.as)).join('|')})(?:\\b|\\()`, 'g')

    // Create map
    ctx.map.clear()
    for (const _import of imports) {
      ctx.map.set(_import.as, _import)
    }

    return imports
  }

  async function modifyDynamicImports (fn: (imports: Import[]) => Promise<void> | void) {
    await fn(ctx.dynamicImports)
    _combinedImports = undefined
  }

  reload()

  return {
    modifyDynamicImports,
    getImports: () => ctx.imports,
    detectImports: (code: string) => detectImports(code, ctx),
    injectImports: (code: string, mergeExisting?: boolean) => injectImports(code, ctx, mergeExisting),
    toExports: () => toExports(ctx.imports),
    generateTypeDecarations: (options?: TypeDeclrationOptions) => toTypeDeclrationFile(ctx.imports, options)
  }
}

// eslint-disable-next-line require-await
async function detectImports (code: string, ctx: Context) {
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

async function injectImports (code: string, ctx: Context, mergeExisting?: boolean) {
  const { isCJSContext, matchedImports } = await detectImports(code, ctx)

  return addImportToCode(code, matchedImports, isCJSContext, mergeExisting)
}
