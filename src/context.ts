import { detectSyntax, findStaticImports, parseStaticImport } from 'mlly'
import MagicString from 'magic-string'
import type { Addon, Import, InjectImportsOptions, Thenable, TypeDeclarationOptions, UnimportContext, UnimportOptions } from './types'
import { excludeRE, stripCommentsAndStrings, separatorRE, importAsRE, toTypeDeclarationFile, addImportToCode, dedupeImports, toExports, normalizeImports, matchRE, getMagicString } from './utils'
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
    async getImports () {
      await resolvePromise
      return updateImports()
    },
    async getImportMap () {
      await ctx.getImports()
      return _map
    },
    invalidate () {
      _combinedImports = undefined
    },
    resolveId: (id, parentId) => opts.resolveId?.(id, parentId),
    addons,
    options: opts
  }

  // Resolve presets
  const resolvePromise = resolveBuiltinPresets(opts.presets || [])
    .then((r) => {
      ctx.staticImports.unshift(...r)
      updateImports()
    })

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

  async function generateTypeDeclarations (options?: TypeDeclarationOptions) {
    const opts: TypeDeclarationOptions = {
      resolvePath: i => i.from.replace(/\.ts$/, ''),
      ...options
    }
    let dts = toTypeDeclarationFile(await ctx.getImports(), opts)
    for (const addon of ctx.addons) {
      dts = await addon.declaration?.call(ctx, dts, opts) ?? dts
    }
    return dts
  }

  updateImports()

  return {
    clearDynamicImports,
    modifyDynamicImports,
    getImports: () => ctx.getImports(),
    detectImports: (code: string | MagicString) => detectImports(code, ctx),
    injectImports: (code: string | MagicString, id?: string, options?: InjectImportsOptions) => injectImports(code, id, ctx, options),
    toExports: async (filepath?: string) => toExports(await ctx.getImports(), filepath),
    parseVirtualImports: (code: string) => parseVirtualImports(code, ctx),
    generateTypeDeclarations
  }
}

function parseVirtualImports (code: string, ctx: UnimportContext) {
  if (ctx.options.virtualImports?.length) {
    return findStaticImports(code)
      .filter(i => ctx.options.virtualImports!.includes(i.specifier))
      .map(i => parseStaticImport(i))
  }
  return []
}

// eslint-disable-next-line require-await
async function detectImports (code: string | MagicString, ctx: UnimportContext, options?: InjectImportsOptions) {
  const s = getMagicString(code)
  // Strip comments so we don't match on them
  const original = s.original
  const strippedCode = stripCommentsAndStrings(original)
  const syntax = detectSyntax(strippedCode)
  const isCJSContext = syntax.hasCJS && !syntax.hasESM
  let matchedImports: Import[] = []

  const map = await ctx.getImportMap()
  // Auto import, search for unreferenced usages
  if (options?.autoImport !== false) {
    // Find all possible injection
    const identifiers = new Set(
      Array.from(strippedCode.matchAll(matchRE))
        .map((i) => {
          // Remove dot access, but keep destructuring
          if (i[1] === '.') {
            return ''
          }
          // Remove property, but keep `switch case`
          const end = strippedCode[i.index! + i[0].length]
          if (end === ':' && i[1].trim() !== 'case') {
            return ''
          }
          return i[2]
        })
        .filter(Boolean)
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

    matchedImports = Array.from(identifiers)
      .map(name => map.get(name))
      .filter(i => i && !i.disabled) as Import[]

    for (const addon of ctx.addons) {
      matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports
    }
  }

  // Transform virtual imports like `import { foo } from '#imports'`
  if (options?.transformVirtualImoports !== false && ctx.options.virtualImports?.length) {
    const virtualImports = parseVirtualImports(original, ctx)
    virtualImports.forEach((i) => {
      s.remove(i.start, i.end)
      Object.entries(i.namedImports || {})
        .forEach(([name, as]) => {
          const original = map.get(name)
          if (!original) {
            throw new Error(`[unimport] failed to find "${name}" imported from "${i.specifier}"`)
          }
          matchedImports.push({
            from: original.from,
            name: original.name,
            as
          })
        })
    })
  }

  return {
    s,
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

  const { isCJSContext, matchedImports } = await detectImports(s, ctx, options)
  const imports = await resolveImports(ctx, matchedImports, id)

  return addImportToCode(s, imports, isCJSContext, options?.mergeExisting)
}

async function resolveImports (ctx: UnimportContext, imports: Import[], id: string | undefined) {
  const resolveCache = new Map<string, string>()

  return await Promise.all(imports.map(async (i) => {
    if (!resolveCache.has(i.from)) {
      resolveCache.set(i.from, await ctx.resolveId(i.from, id) || i.from)
    }
    return <Import>{
      ...i,
      from: resolveCache.get(i.from)!
    }
  }))
}
