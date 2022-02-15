import escapeRE from 'escape-string-regexp'

export interface AutoImport {
  /** Export name to be imported */
  name: string
  /** Import as this name */
  as: string
  /** Module specifier to import from */
  from: string
  /** Disable auto import */
  disabled?: boolean
}

export interface AutoImportContext {
  autoImports: AutoImport[]
  matchRE: RegExp
  transform: {
    exclude: RegExp[]
  }
  map: Map<string, AutoImport>
}

export interface CreateAutoImportContextOptions {
  /**
   * @default [/node_modules/]
   */
  exclude: RegExp[]
}

export function createAutoImportContext (opts: CreateAutoImportContextOptions): AutoImportContext {
  return {
    autoImports: [],
    map: new Map(),
    matchRE: /__never__/,
    transform: {
      exclude: opts.exclude || [/node_modules/]
    }
  }
}

export function updateAutoImportContext (ctx: AutoImportContext) {
  // Detect duplicates
  const usedNames = new Set()
  for (const autoImport of ctx.autoImports) {
    if (usedNames.has(autoImport.as)) {
      autoImport.disabled = true
      console.warn(`Disabling duplicate auto import '${autoImport.as}' (imported from '${autoImport.from}')`)
    } else {
      usedNames.add(autoImport.as)
    }
  }

  // Filter out disabled auto imports
  ctx.autoImports = ctx.autoImports.filter(i => i.disabled !== true)

  // Create regex
  ctx.matchRE = new RegExp(`\\b(${ctx.autoImports.map(i => escapeRE(i.as)).join('|')})\\b`, 'g')

  // Create map
  ctx.map.clear()
  for (const autoImport of ctx.autoImports) {
    ctx.map.set(autoImport.as, autoImport)
  }

  return ctx
}
