import type MagicString from 'magic-string'
import type {
  Import,
  ImportInjectionResult,
  InjectImportsOptions,
  Thenable,
  TypeDeclarationOptions,
  Unimport,
  UnimportContext,
  UnimportMeta,
  UnimportOptions,
} from './types'

import { version } from '../package.json'
import { configureAddons } from './addons/addons'
import { detectImports } from './detect'
import { dedupeDtsExports, scanExports, scanFilesFromDir } from './node/scan-dirs'
import { resolveBuiltinPresets } from './preset'
import { addImportToCode, dedupeImports, getMagicString, normalizeImports, stripFileExtension, toExports, toTypeDeclarationFile, toTypeReExports } from './utils'

export function createUnimport(opts: Partial<UnimportOptions>): Unimport {
  const ctx = createInternalContext(opts)

  async function generateTypeDeclarations(options?: TypeDeclarationOptions) {
    const opts: TypeDeclarationOptions = {
      resolvePath: i => stripFileExtension(i.typeFrom || i.from),
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
    await ctx.modifyDynamicImports(imports => imports.filter(i => i.from !== filepath).concat(additions))
    return additions
  }

  async function scanImportsFromDir(dirs = ctx.options.dirs || [], options = ctx.options.dirsScanOptions) {
    const files = await scanFilesFromDir(dirs, options)
    const includeTypes = options?.types ?? true
    const imports = (await Promise.all(files.map(dir => scanExports(dir, includeTypes)))).flat()
    const deduped = dedupeDtsExports(imports)
    await ctx.modifyDynamicImports(imports => imports.filter(i => !files.includes(i.from)).concat(deduped))
    return imports
  }

  async function injectImportsWithContext(code: string | MagicString, id?: string, options?: InjectImportsOptions) {
    const result = await injectImports(code, id, ctx, {
      ...opts,
      ...options,
    })

    // Collect metadata
    const metadata = ctx.getMetadata()
    if (metadata) {
      result.imports.forEach((i) => {
        const injectionUsage = metadata.injectionUsage[i.name] ??= { import: i, count: 0, moduleIds: [] }
        injectionUsage.count++
        if (id && !injectionUsage.moduleIds.includes(id)) {
          injectionUsage.moduleIds.push(id)
        }
      })
      result.addonsImports.forEach((i) => {
        const injectionUsage = metadata.injectionUsage[i.as ?? i.name] ??= { import: i, count: 0, moduleIds: [] }
        injectionUsage.count++
        if (id && !injectionUsage.moduleIds.includes(id)) {
          injectionUsage.moduleIds.push(id)
        }
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
    version,
    init,
    clearDynamicImports: () => ctx.clearDynamicImports(),
    modifyDynamicImports: fn => ctx.modifyDynamicImports(fn),
    scanImportsFromDir,
    scanImportsFromFile,
    getImports: () => ctx.getImports(),
    getImportMap: () => ctx.getImportMap(),
    detectImports: (code: string | MagicString) => detectImports(code, ctx),
    injectImports: injectImportsWithContext,
    generateTypeDeclarations: (options?: TypeDeclarationOptions) => generateTypeDeclarations(options),
    getMetadata: () => ctx.getMetadata(),
    getInternalContext: () => ctx,

    // Deprecated
    toExports: async (filepath?: string, includeTypes = false) => toExports(await ctx.getImports(), filepath, includeTypes),
  }
}

function createInternalContext(opts: Partial<UnimportOptions>) {
  // Cache for combine imports
  let _combinedImports: Import[] | undefined
  const _map = new Map()

  const addons = configureAddons(opts)

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
    modifyDynamicImports,
    clearDynamicImports,
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

  return ctx
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
      addonsImports: [],
    }
  }

  const addonsImports: Import[] = []

  for (const addon of ctx.addons)
    await addon.transform?.call(ctx, s, id, addonsImports)

  const { isCJSContext, matchedImports, firstOccurrence } = await detectImports(s, ctx, options)
  const imports = await resolveImports(ctx, matchedImports, id)

  if (ctx.options.commentsDebug?.some(c => s.original.includes(c))) {
    // eslint-disable-next-line no-console
    const log = ctx.options.debugLog || console.log
    log(`[unimport] ${imports.length} imports detected in "${id}"${imports.length ? `: ${imports.map(i => i.name).join(', ')}` : ''}`)
    log(`[unimport] ${addonsImports.length} directives imports detected in "${id}"${addonsImports.length ? `: ${addonsImports.map(i => i.as ?? i.name).join(', ')}` : ''}`)
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
    addonsImports,
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
