import type MagicString from 'magic-string'
import type { ESMExport } from 'mlly'
import type { BuiltinPresetName } from './presets'

export type ModuleId = string
export type ImportName = string

export interface ImportCommon {
  /** Module specifier to import from */
  from: ModuleId
  /**
   * Priority of the import, if multiple imports have the same name, the one with the highest priority will be used
   * @default 1
   */
  priority?: number
  /** If this import is disabled */
  disabled?: boolean
  /** Won't output import in declaration file if true */
  dtsDisabled?: boolean
  /** Import declaration type like const / var / enum */
  declarationType?: ESMExport['declarationType']
  /**
   * Metadata of the import
   */
  meta?: {
    /** Short description of the import */
    description?: string
    /** URL to the documentation */
    docsUrl?: string
    /** Additional metadata */
    [key: string]: any
  }
  /**
   * If this import is a pure type import
   */
  type?: boolean
  /**
   * Using this as the from when generating type declarations
   */
  typeFrom?: ModuleId
}

export interface Import extends ImportCommon {
  /** Import name to be detected */
  name: ImportName
  /** Import as this name */
  as?: ImportName
  /**
   * With properties
   *
   * Ignored for CJS imports.
   */
  with?: Record<string, string>
}

export type PresetImport = Omit<Import, 'from'> | ImportName | [name: ImportName, as?: ImportName, from?: ModuleId]

export interface InlinePreset extends ImportCommon {
  imports: (PresetImport | InlinePreset)[]
}

/**
 * Auto extract exports from a package for auto import
 */
export interface PackagePreset {
  /**
   * Name of the package
   */
  package: string

  /**
   * Path of the importer
   * @default process.cwd()
   */
  url?: string

  /**
   * RegExp, string, or custom function to exclude names of the extracted imports
   */
  ignore?: (string | RegExp | ((name: string) => boolean))[]

  /**
   * Use local cache if exits
   * @default true
   */
  cache?: boolean
}

export type Preset = InlinePreset | PackagePreset

export interface UnimportContext {
  readonly version: string

  options: Partial<UnimportOptions>
  staticImports: Import[]
  dynamicImports: Import[]
  addons: Addon[]

  getImports: () => Promise<Import[]>
  getImportMap: () => Promise<Map<string, Import>>
  getMetadata: () => UnimportMeta | undefined

  modifyDynamicImports: (fn: (imports: Import[]) => Thenable<void | Import[]>) => Promise<void>
  clearDynamicImports: () => void
  replaceImports: (imports: UnimportOptions['imports']) => Promise<Import[]>

  invalidate: () => void
  resolveId: (id: string, parentId?: string) => Thenable<string | null | undefined | void>
}

export interface DetectImportResult {
  s: MagicString
  strippedCode: string
  isCJSContext: boolean
  matchedImports: Import[]
  firstOccurrence: number
}

export interface Unimport {
  readonly version: string
  init: () => Promise<void>

  clearDynamicImports: UnimportContext['clearDynamicImports']
  getImportMap: UnimportContext['getImportMap']
  getImports: UnimportContext['getImports']
  getInternalContext: () => UnimportContext
  getMetadata: UnimportContext['getMetadata']
  modifyDynamicImports: UnimportContext['modifyDynamicImports']
  generateTypeDeclarations: (options?: TypeDeclarationOptions) => Promise<string>

  /**
   * Get un-imported usages from code
   */
  detectImports: (code: string | MagicString) => Promise<DetectImportResult>
  /**
   * Insert missing imports statements to code
   */
  injectImports: (code: string | MagicString, id?: string, options?: InjectImportsOptions) => Promise<ImportInjectionResult>

  scanImportsFromDir: (dir?: string[], options?: ScanDirExportsOptions) => Promise<Import[]>
  scanImportsFromFile: (file: string, includeTypes?: boolean) => Promise<Import[]>

  /**
   * @deprecated
   */
  toExports: (filepath?: string, includeTypes?: boolean) => Promise<string>
}

export interface InjectionUsageRecord {
  import: Import
  count: number
  moduleIds: string[]
}

export interface UnimportMeta {
  injectionUsage: Record<string, InjectionUsageRecord>
}

export interface AddonsOptions {
  addons?: Addon[]
  /**
   * Enable auto import inside for Vue's <template>
   *
   * @default false
   */
  vueTemplate?: boolean
  /**
   * Enable auto import directives for Vue's SFC.
   *
   * Library authors should include `meta.vueDirective: true` in the import metadata.
   *
   * When using a local directives folder, provide the `isDirective`
   * callback to check if the import is a Vue directive.
   */
  vueDirectives?: true | AddonVueDirectivesOptions
}

export interface AddonVueDirectivesOptions {
  /**
   * Checks if the import is a Vue directive.
   *
   * **NOTES**:
   * - imports from a library should include `meta.vueDirective: true`.
   * - this callback is only invoked for local directives (only when meta.vueDirective is not set).
   *
   * @param from The path of the import normalized.
   * @param importEntry The import entry.
   */
  isDirective?: (from: string, importEntry: Import) => boolean
}

export interface UnimportOptions extends Pick<InjectImportsOptions, 'injectAtEnd' | 'mergeExisting' | 'parser'> {
  /**
   * Auto import items
   */
  imports: Import[]

  /**
   * Auto import preset
   */
  presets: (Preset | BuiltinPresetName)[]

  /**
   * Custom warning function
   * @default console.warn
   */
  warn: (msg: string) => void

  /**
   * Custom debug log function
   * @default console.log
   */
  debugLog: (msg: string) => void

  /**
   * Unimport Addons.
   * To use built-in addons, use:
   * ```js
   * addons: {
   *   addons: [<custom-addons-here>] // if you want to use also custom addons
   *   vueTemplate: true,
   *   vueDirectives: [<the-directives-here>]
   * }
   * ```
   *
   * Built-in addons:
   * - vueDirectives: enable auto import directives for Vue's SFC
   * - vueTemplate: enable auto import inside for Vue's <template>
   *
   * @default {}
   */
  addons: AddonsOptions | Addon[]

  /**
   * Name of virtual modules that exposed all the registed auto-imports
   * @default []
   */
  virtualImports: string[]

  /**
   * Directories to scan for auto import
   * @default []
   */
  dirs?: string[]

  /**
   * Options for scanning directories for auto import
   */
  dirsScanOptions?: ScanDirExportsOptions

  /**
   * Custom resolver to auto import id
   */
  resolveId?: (id: string, importee?: string) => Thenable<string | void>

  /**
   * Custom magic comments to be opt-out for auto import, per file/module
   *
   * @default ['@unimport-disable', '@imports-disable']
   */
  commentsDisable?: string[]

  /**
   * Custom magic comments to debug auto import, printed to console
   *
   * @default ['@unimport-debug', '@imports-debug']
   */
  commentsDebug?: string[]

  /**
   * Collect meta data for each auto import. Accessible via `ctx.meta`
   */
  collectMeta?: boolean
}

export type PathFromResolver = (_import: Import) => string | undefined

export interface ScanDirExportsOptions {
  /**
   * Glob patterns for matching files
   *
   * @default ['*.{ts,js,mjs,cjs,mts,cts}']
   */
  filePatterns?: string[]

  /**
   * Custom function to filter scanned files
   */
  fileFilter?: (file: string) => boolean

  /**
   * Register type exports
   *
   * @default true
   */
  types?: boolean

  /**
   * Current working directory
   *
   * @default process.cwd()
   */
  cwd?: string
}

export interface TypeDeclarationOptions {
  /**
   * Custom resolver for path of the import
   */
  resolvePath?: PathFromResolver
  /**
   * Append `export {}` to the end of the file
   *
   * @default true
   */
  exportHelper?: boolean
  /**
   * Auto-import for type exports
   *
   * @default true
   */
  typeReExports?: boolean
}

export interface InjectImportsOptions {
  /**
   * Merge the existing imports
   *
   * @default false
   */
  mergeExisting?: boolean

  /**
   * If the module should be auto imported
   *
   * @default true
   */
  autoImport?: boolean

  /**
   * If the module should be transformed for virtual modules.
   * Only available when `virtualImports` is set.
   *
   * @default true
   */
  transformVirtualImports?: boolean

  /**
   * Parser to use for parsing the code
   *
   * Note that `acorn` only takes valid JS Code, should usually only be used after transformationa and transpilation
   *
   * @default 'regex'
   */
  parser?: 'acorn' | 'regex'

  /**
   * Inject the imports at the end of other imports
   *
   * @default false
   */
  injectAtEnd?: boolean
}

export type Thenable<T> = Promise<T> | T

export interface Addon {
  name?: string
  transform?: (this: UnimportContext, code: MagicString, id: string | undefined, imports: Import[]) => Thenable<MagicString>
  declaration?: (this: UnimportContext, dts: string, options: TypeDeclarationOptions) => Thenable<string>
  matchImports?: (this: UnimportContext, identifiers: Set<string>, matched: Import[]) => Thenable<Import[] | void>
  /**
   * Extend or modify the imports list before injecting
   */
  extendImports?: (this: UnimportContext, imports: Import[]) => Import[] | void
  /**
   * Resolve imports before injecting
   */
  injectImportsResolved?: (this: UnimportContext, imports: Import[], code: MagicString, id?: string) => Import[] | void
  /**
   * Modify the injection code before injecting
   */
  injectImportsStringified?: (this: UnimportContext, injection: string, imports: Import[], code: MagicString, id?: string) => string | void
}

export interface InstallGlobalOptions {
  /**
   * @default globalThis
   */
  globalObject?: any

  /**
   * Overrides the existing property
   * @default false
   */
  overrides?: boolean
}

export interface MagicStringResult {
  s: MagicString
  code: string
}

export interface ImportInjectionResult extends MagicStringResult {
  imports: Import[]
  addonsImports: Import[]
}
