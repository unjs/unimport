import { detectSyntax } from 'mlly'
import MagicString from 'magic-string'
import type { Addon, Import, InjectImportsOptions, Thenable, TypeDeclrationOptions, UnimportContext, UnimportOptions } from './types'
import { excludeRE, stripCommentsAndStrings, separatorRE, importAsRE, toTypeDeclrationFile, addImportToCode, dedupeImports, toExports, normalizeImports, matchRE, getMagicString, getString } from './utils'
import { resolveBuiltinPresets } from './preset'
import { vueTemplateAddon } from './addons'

export type Unimport = ReturnType<typeof createUnimport>

export function createUnimport (opts: Partial<UnimportOptions>) {
  // Cache for combine imports
  let _combinedImports: Import[] | undefined
  const _map = new Map()

  const addons: Addon[] = []

  if (Array.isArray(opts.addons)) {
    addons.push(...opts.addons)
  } else if (opts.addons?.vueTemplate) {
    addons.push(vueTemplateAddon())
  }

  const ctx: UnimportContext = {
    staticImports: [...(opts.imports || [])].filter(Boolean),
    dynamicImports: [],
    get imports () {
      return updateImports()
    },
    get map () {
      updateImports()
      return _map
    },
    invalidate () {
      _combinedImports = undefined
    },
    addons
  }

  // Resolve presets
  ctx.staticImports.push(...resolveBuiltinPresets(opts.presets || []))

  function updateImports () {
    if (!_combinedImports) {
      // Combine static and dynamic imports
      // eslint-disable-next-line no-console
      const imports = normalizeImports(dedupeImports([...ctx.staticImports, ...ctx.dynamicImports], opts.warn || console.warn))
        .filter(i => !i.disabled)

      // Create map
      _map.clear()
      for (const _import of imports) {
        _map.set(_import.as ?? _import.name, _import)
      }

      _combinedImports = imports
    }
    return _combinedImports
  }

  async function modifyDynamicImports (fn: (imports: Import[]) => Thenable<void | Import[]>) {
    const result = await fn(ctx.dynamicImports)
    if (Array.isArray(result)) {
      ctx.dynamicImports = result
    }
    ctx.invalidate()
  }

  function clearDynamicImports () {
    ctx.dynamicImports.length = 0
    ctx.invalidate()
  }

  function generateTypeDecarations (options?: TypeDeclrationOptions) {
    const opts: TypeDeclrationOptions = {
      resolvePath: i => i.from.replace(/\.ts$/, ''),
      ...options
    }
    let dts = toTypeDeclrationFile(ctx.imports, opts)
    for (const addon of ctx.addons) {
      dts = addon.decleration?.call(ctx, dts, opts) ?? dts
    }
    return dts
  }

  updateImports()

  return {
    clearDynamicImports,
    modifyDynamicImports,
    getImports: () => ctx.imports,
    detectImports: (code: string) => detectImports(code, ctx),
    injectImports: (code: string | MagicString, id?: string, options?: InjectImportsOptions) => injectImports(code, id, ctx, options),
    toExports: () => toExports(ctx.imports),
    generateTypeDecarations
  }
}

// eslint-disable-next-line require-await
async function detectImports (code: string | MagicString, ctx: UnimportContext) {
  // Strip comments so we don't match on them
  const strippedCode = stripCommentsAndStrings(getString(code))
  const syntax = detectSyntax(strippedCode)
  const isCJSContext = syntax.hasCJS && !syntax.hasESM

  // Find all possible injection
  const identifiers = new Set(
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
      .forEach(i => identifiers.delete(i))
  }

  let matchedImports = Array.from(identifiers)
    .map(name => ctx.map.get(name))
    .filter(i => i && !i.disabled) as Import[]

  for (const addon of ctx.addons) {
    matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports
  }

  return {
    strippedCode,
    isCJSContext,
    matchedImports
  }
}

async function injectImports (code: string | MagicString, id: string | undefined, ctx: UnimportContext, options?: InjectImportsOptions) {
  const s = getMagicString(code)

  for (const addon of ctx.addons) {
    await addon.transform?.call(ctx, s, id)
  }

  const { isCJSContext, matchedImports } = await detectImports(s, ctx)

  return addImportToCode(s, matchedImports, isCJSContext, options?.mergeExisting)
}
