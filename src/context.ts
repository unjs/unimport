import { detectSyntax, findStaticImports, parseStaticImport } from 'mlly'
import type MagicString from 'magic-string'
import { version } from '../package.json'
import type { Addon, Import, ImportInjectionResult, InjectImportsOptions, Thenable, TypeDeclarationOptions, UnimportContext, UnimportMeta, UnimportOptions } from './types'
import { addImportToCode, dedupeImports, excludeRE, getMagicString, importAsRE, matchRE, normalizeImports, separatorRE, stripCommentsAndStrings, toExports, toTypeDeclarationFile, toTypeReExports } from './utils'
import { resolveBuiltinPresets } from './preset'
import { vueTemplateAddon } from './addons'
import { dedupeDtsExports, scanExports, scanFilesFromDir } from './scan-dirs'

export type Unimport = ReturnType<typeof createUnimport>

export function createUnimport(opts: Partial<UnimportOptions>) {
  // Cache for combine imports
  let _combinedImports: Import[] | undefined
  const _map = new Map()

  const addons: Addon[] = []

  if (Array.isArray(opts.addons))
    addons.push(...opts.addons)
  else if (opts.addons?.vueTemplate)
    addons.push(vueTemplateAddon())

  opts.addons = addons
  opts.commentsDisable = opts.commentsDisable ?? ['@unimport-disable', '@imports-disable']
  opts.commentsDebug = opts.commentsDebug ?? ['@unimport-debug', '@imports-debug']

  let metadata: UnimportMeta | undefined

  if (opts.collectMeta) {
    metadata = {
      injectionUsage: {},
    }
  }

  let resolvePromise: Promise<void>

  const ctx: UnimportContext = {
    version,

    options: opts,
    addons,
    staticImports: [...(opts.imports || [])].filter(Boolean),
    dynamicImports: [],
    async getImports() {
      await resolvePromise
      return updateImports()
    },
    async replaceImports(imports: UnimportOptions['imports']) {
      ctx.staticImports = [...(imports || [])].filter(Boolean)
      ctx.invalidate()
      await resolvePromise
      return updateImports()
    },
    async getImportMap() {
      await ctx.getImports()
      return _map
    },
    getMetadata() {
      return metadata
    },
    invalidate() {
      _combinedImports = undefined
    },
    resolveId: (id, parentId) => opts.resolveId?.(id, parentId),
  }

  // Resolve presets
  resolvePromise = resolveBuiltinPresets(opts.presets || [])
    .then((r) => {
      ctx.staticImports.unshift(...r)
      _combinedImports = undefined
      updateImports()
    })

  function updateImports() {
    if (!_combinedImports) {
      // Combine static and dynamic imports

      let imports = normalizeImports(dedupeImports([...ctx.staticImports, ...ctx.dynamicImports], opts.warn || console.warn))

      for (const addon of ctx.addons) {
        if (addon.extendImports)
          imports = addon.extendImports.call(ctx, imports) ?? imports
      }

      imports = imports.filter(i => !i.disabled)

      // Create map
      _map.clear()
      for (const _import of imports) {
        if (!_import.type)
          _map.set(_import.as ?? _import.name, _import)
      }

      _combinedImports = imports
    }
    return _combinedImports
  }

  async function modifyDynamicImports(fn: (imports: Import[]) => Thenable<void | Import[]>) {
    const result = await fn(ctx.dynamicImports)
    if (Array.isArray(result))
      ctx.dynamicImports = result

    ctx.invalidate()
  }

  function clearDynamicImports() {
    ctx.dynamicImports.length = 0
    ctx.invalidate()
  }

  async function generateTypeDeclarations(options?: TypeDeclarationOptions) {
    const opts: TypeDeclarationOptions = {
      resolvePath: i => i.typeFrom || i.from,
      ...options,
    }
    const {
      typeReExports = true,
    } = opts
    const imports = await ctx.getImports()
    let dts = toTypeDeclarationFile(imports.filter(i => !i.type && !i.dtsDisabled), opts)
    const typeOnly = imports.filter(i => i.type)
    if (typeReExports && typeOnly.length)
      dts += `\n${toTypeReExports(typeOnly, opts)}`

    for (const addon of ctx.addons)
      dts = await addon.declaration?.call(ctx, dts, opts) ?? dts

    return dts
  }

  async function scanImportsFromFile(filepath: string, includeTypes = true) {
    const additions = await scanExports(filepath, includeTypes)
    await modifyDynamicImports(imports => imports.filter(i => i.from !== filepath).concat(additions))
    return additions
  }

  async function scanImportsFromDir(dirs = ctx.options.dirs || [], options = ctx.options.dirsScanOptions) {
    const files = await scanFilesFromDir(dirs, options)
    const includeTypes = options?.types ?? true
    const imports = (await Promise.all(files.map(dir => scanExports(dir, includeTypes)))).flat()
    const deduped = dedupeDtsExports(imports)
    await modifyDynamicImports(imports => imports.filter(i => !files.includes(i.from)).concat(deduped))
    return imports
  }

  async function injectImportsWithContext(code: string | MagicString, id?: string, options?: InjectImportsOptions) {
    const result = await injectImports(code, id, ctx, {
      ...opts,
      ...options,
    })

    // Collect metadata
    if (metadata) {
      result.imports.forEach((i) => {
        metadata!.injectionUsage[i.name] = metadata!.injectionUsage[i.name] || { import: i, count: 0, moduleIds: [] }
        metadata!.injectionUsage[i.name].count++
        if (id && !metadata!.injectionUsage[i.name].moduleIds.includes(id))
          metadata!.injectionUsage[i.name].moduleIds.push(id)
      })
    }

    return result
  }

  /**
   * Initialize unimport:
   * - scan imports from dirs
   */
  async function init() {
    if (ctx.options.dirs?.length)
      await scanImportsFromDir()
  }

  // Public API
  return {
    init,
    clearDynamicImports,
    modifyDynamicImports,
    scanImportsFromDir,
    scanImportsFromFile,
    getImports: () => ctx.getImports(),
    getImportMap: () => ctx.getImportMap(),
    detectImports: (code: string | MagicString) => detectImports(code, ctx),
    injectImports: injectImportsWithContext,
    toExports: async (filepath?: string, includeTypes = false) => toExports(await ctx.getImports(), filepath, includeTypes),
    parseVirtualImports: (code: string) => parseVirtualImports(code, ctx),
    generateTypeDeclarations: (options?: TypeDeclarationOptions) => generateTypeDeclarations(options),
    getMetadata: () => ctx.getMetadata(),
    getInternalContext: () => ctx,
  }
}

function parseVirtualImports(code: string, ctx: UnimportContext) {
  if (ctx.options.virtualImports?.length) {
    return findStaticImports(code)
      .filter(i => ctx.options.virtualImports!.includes(i.specifier))
      .map(i => parseStaticImport(i))
  }
  return []
}

async function detectImports(code: string | MagicString, ctx: UnimportContext, options?: InjectImportsOptions) {
  const s = getMagicString(code)
  // Strip comments so we don't match on them
  const original = s.original
  const strippedCode = stripCommentsAndStrings(
    original,
    // Do not strip comments if they are virtual import names
    options?.transformVirtualImports !== false && ctx.options.virtualImports?.length
      ? {
          filter: i => !(ctx.options.virtualImports!.includes(i)),
          fillChar: '-',
        }
      : undefined,
  )
  const syntax = detectSyntax(strippedCode)
  const isCJSContext = syntax.hasCJS && !syntax.hasESM
  let matchedImports: Import[] = []

  const occurrenceMap = new Map<string, number>()

  const map = await ctx.getImportMap()
  // Auto import, search for unreferenced usages
  if (options?.autoImport !== false) {
    // Find all possible injection
    Array.from(strippedCode.matchAll(matchRE))
      .forEach((i) => {
        // Remove dot access, but keep destructuring
        if (i[1] === '.')
          return null

        // Remove property, but keep `case x:` and `? x :`
        const end = strippedCode[i.index! + i[0].length]
        // also keeps deep ternary like `true ? false ? a : b : c`
        const before = strippedCode[i.index! - 1]
        if (end === ':' && !['?', 'case'].includes(i[1].trim()) && before !== ':')
          return null

        const name = i[2]
        const occurrence = i.index! + i[1].length
        if (occurrenceMap.get(name) || Number.POSITIVE_INFINITY > occurrence)
          occurrenceMap.set(name, occurrence)
      })

    // Remove those already defined
    for (const regex of excludeRE) {
      for (const match of strippedCode.matchAll(regex)) {
        const segments = [...match[1]?.split(separatorRE) || [], ...match[2]?.split(separatorRE) || []]
        for (const segment of segments) {
          const identifier = segment.replace(importAsRE, '').trim()
          occurrenceMap.delete(identifier)
        }
      }
    }

    const identifiers = new Set(occurrenceMap.keys())
    matchedImports = Array.from(identifiers)
      .map((name) => {
        const item = map.get(name)
        if (item && !item.disabled)
          return item

        occurrenceMap.delete(name)
        return null
      })
      .filter(Boolean) as Import[]

    for (const addon of ctx.addons)
      matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports
  }

  // Transform virtual imports like `import { foo } from '#imports'`
  if (options?.transformVirtualImports !== false && options?.transformVirtualImoports !== false && ctx.options.virtualImports?.length) {
    const virtualImports = parseVirtualImports(strippedCode, ctx)
    virtualImports.forEach((i) => {
      s.remove(i.start, i.end)
      Object.entries(i.namedImports || {})
        .forEach(([name, as]) => {
          const original = map.get(name)
          if (!original)
            throw new Error(`[unimport] failed to find "${name}" imported from "${i.specifier}"`)

          matchedImports.push({
            from: original.from,
            name: original.name,
            as,
          })
        })
    })
  }

  const firstOccurrence = Math.min(...Array.from(occurrenceMap.entries()).map(i => i[1]))

  return {
    s,
    strippedCode,
    isCJSContext,
    matchedImports,
    firstOccurrence,
  }
}

async function injectImports(
  code: string | MagicString,
  id: string | undefined,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
): Promise<ImportInjectionResult> {
  const s = getMagicString(code)

  if (ctx.options.commentsDisable?.some(c => s.original.includes(c))) {
    return {
      s,
      get code() { return s.toString() },
      imports: [],
    }
  }

  for (const addon of ctx.addons)
    await addon.transform?.call(ctx, s, id)

  const { isCJSContext, matchedImports, firstOccurrence } = await detectImports(s, ctx, options)
  const imports = await resolveImports(ctx, matchedImports, id)

  if (ctx.options.commentsDebug?.some(c => s.original.includes(c))) {
    // eslint-disable-next-line no-console
    const log = ctx.options.debugLog || console.log
    log(`[unimport] ${imports.length} imports detected in "${id}"${imports.length ? `: ${imports.map(i => i.name).join(', ')}` : ''}`)
  }

  return {
    ...addImportToCode(
      s,
      imports,
      isCJSContext,
      options?.mergeExisting,
      options?.injectAtEnd,
      firstOccurrence,
      (imports) => {
        for (const addon of ctx.addons)
          imports = addon.injectImportsResolved?.call(ctx, imports, s, id) ?? imports

        return imports
      },
      (str, imports) => {
        for (const addon of ctx.addons)
          str = addon.injectImportsStringified?.call(ctx, str, imports, s, id) ?? str

        return str
      },
    ),
    imports,
  }
}

async function resolveImports(ctx: UnimportContext, imports: Import[], id: string | undefined) {
  const resolveCache = new Map<string, string>()

  const _imports = await Promise.all(imports.map(async (i) => {
    if (!resolveCache.has(i.from))
      resolveCache.set(i.from, await ctx.resolveId(i.from, id) || i.from)

    const from = resolveCache.get(i.from)!

    // reference to self
    if (i.from === id || !from || from === '.' || from === id)
      return

    return <Import>{
      ...i,
      from,
    }
  }))

  return _imports.filter(Boolean) as Import[]
}
