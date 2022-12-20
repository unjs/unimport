import { detectSyntax, findStaticImports, parseStaticImport } from 'mlly'
import MagicString from 'magic-string'
import type { Addon, Import, ImportInjectionResult, InjectImportsOptions, Thenable, TypeDeclarationOptions, UnimportContext, UnimportOptions } from './types'
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

  opts.addons = addons
  opts.commentsDisable = opts.commentsDisable ?? ['@unimport-disable', '@imports-disable']
  opts.commentsDebug = opts.commentsDebug ?? ['@unimport-debug', '@imports-debug']

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
      _combinedImports = undefined
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
          // Remove property, but keep `case x:` and `? x :`
          const end = strippedCode[i.index! + i[0].length]
          if (end === ':' && !['?', 'case'].includes(i[1].trim())) {
            return ''
          }
          return i[2]
        })
        .filter(Boolean)
    )

    // Remove those already defined
    for (const regex of excludeRE) {
      for (const match of strippedCode.matchAll(regex)) {
        const segments = [...match[1]?.split(separatorRE) || [], ...match[2]?.split(separatorRE) || []]
        for (const segment of segments) {
          const identifier = segment.replace(importAsRE, '').trim()
          identifiers.delete(identifier)
        }
      }
    }

    matchedImports = Array.from(identifiers)
      .map(name => map.get(name))
      .filter(i => i && !i.disabled) as Import[]

    for (const addon of ctx.addons) {
      matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports
    }
  }

  // Transform virtual imports like `import { foo } from '#imports'`
  if (options?.transformVirtualImports !== false && options?.transformVirtualImoports !== false && ctx.options.virtualImports?.length) {
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

async function injectImports (code: string | MagicString, id: string | undefined, ctx: UnimportContext, options?: InjectImportsOptions): Promise<ImportInjectionResult> {
  const s = getMagicString(code)

  if (ctx.options.commentsDisable?.some(c => s.original.includes(c))) {
    return {
      s,
      get code () { return s.toString() }
    }
  }

  for (const addon of ctx.addons) {
    await addon.transform?.call(ctx, s, id)
  }

  const { isCJSContext, matchedImports } = await detectImports(s, ctx, options)
  const imports = await resolveImports(ctx, matchedImports, id)

  if (ctx.options.commentsDebug?.some(c => s.original.includes(c))) {
    const log = ctx.options.debugLog || console.log
    log(`[unimport] ${imports.length} imports detected in "${id}"${imports.length ? ': ' +imports.map(i => i.name).join(', ') : ''}`)
  }

  return addImportToCode(s, imports, isCJSContext, options?.mergeExisting)
}

async function resolveImports (ctx: UnimportContext, imports: Import[], id: string | undefined) {
  const resolveCache = new Map<string, string>()

  const _imports = await Promise.all(imports.map(async (i) => {
    if (!resolveCache.has(i.from)) {
      resolveCache.set(i.from, await ctx.resolveId(i.from, id) || i.from)
    }
    const from = resolveCache.get(i.from)!

    // reference to self
    if (i.from === id || !from || from === '.' || from === id) {
      return
    }

    return <Import>{
      ...i,
      from
    }
  }))

  return _imports.filter(Boolean) as Import[]
}
