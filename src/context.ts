import { detectSyntax } from 'mlly'
import MagicString from 'magic-string'
import type { Import, InjectImportsOptions, TypeDeclrationOptions, UnimportOptions } from './types'
import { excludeRE, stripCommentsAndStrings, separatorRE, importAsRE, toTypeDeclrationFile, addImportToCode, dedupeImports, toExports, normalizeImports, matchRE, getMagicString, getString } from './utils'
import { resolveBuiltinPresets } from './preset'
import { vueTemplateAutoImport } from './vue-sfc'

export interface UnimportContext {
  readonly imports: Import[]
  staticImports: Import[]
  dynamicImports: Import[]
  map: Map<string, Import>
}

export type Unimport = ReturnType<typeof createUnimport>

export function createUnimport (opts: Partial<UnimportOptions>) {
  // Cache for combine imports
  let _combinedImports: Import[] | undefined

  const ctx: UnimportContext = {
    staticImports: [...(opts.imports || [])].filter(Boolean),
    dynamicImports: [],
    get imports () {
      if (!_combinedImports) {
        _combinedImports = reload()
      }
      return _combinedImports
    },
    map: new Map()
  }

  // Resolve presets
  ctx.staticImports.push(...resolveBuiltinPresets(opts.presets || []))

  function reload () {
    // Combine static and dynamic imports
    // eslint-disable-next-line no-console
    const imports = normalizeImports(dedupeImports([...ctx.staticImports, ...ctx.dynamicImports], opts.warn || console.warn))
      .filter(i => !i.disabled)

    // Create map
    ctx.map.clear()
    for (const _import of imports) {
      ctx.map.set(_import.as ?? _import.name, _import)
    }

    return imports
  }

  async function modifyDynamicImports (fn: (imports: Import[]) => Promise<void> | void) {
    await fn(ctx.dynamicImports)
    _combinedImports = undefined
  }

  function clearDynamicImports () {
    ctx.dynamicImports.length = 0
  }

  reload()

  return {
    clearDynamicImports,
    modifyDynamicImports,
    getImports: () => ctx.imports,
    detectImports: (code: string) => detectImports(code, ctx),
    injectImports: (code: string | MagicString, options?: InjectImportsOptions) => injectImports(code, ctx, options),
    toExports: () => toExports(ctx.imports),
    generateTypeDecarations: (options?: TypeDeclrationOptions) => toTypeDeclrationFile(ctx.imports, {
      resolvePath: i => i.from.replace(/\.ts$/, ''),
      ...options
    })
  }
}

// eslint-disable-next-line require-await
async function detectImports (code: string | MagicString, ctx: UnimportContext) {
  // Strip comments so we don't match on them
  const strippedCode = stripCommentsAndStrings(getString(code))
  const isCJSContext = detectSyntax(strippedCode).hasCJS

  // Find all possible injection
  const matched = new Set(
    Array.from(strippedCode.matchAll(matchRE)).map(i => i[1])
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
    .filter(i => i && !i.disabled) as Import[]

  return {
    strippedCode,
    isCJSContext,
    matchedImports
  }
}

async function injectImports (code: string | MagicString, ctx: UnimportContext, options?: InjectImportsOptions) {
  const s = getMagicString(code)

  if (options?.vueTemplate) {
    vueTemplateAutoImport(s, ctx)
  }

  const { isCJSContext, matchedImports } = await detectImports(s, ctx)

  return addImportToCode(s, matchedImports, isCJSContext, options?.mergeExisting)
}
