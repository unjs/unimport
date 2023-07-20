/* eslint-disable no-use-before-define */
import MagicString from 'magic-string'
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
  version: string

  options: Partial<UnimportOptions>
  staticImports: Import[]
  dynamicImports: Import[]
  addons: Addon[]

  getImports(): Promise<Import[]>
  getImportMap(): Promise<Map<string, Import>>
  getMetadata(): UnimportMeta | undefined

  replaceImports(imports: UnimportOptions['imports']): Promise<Import[]>

  invalidate(): void
  resolveId(id: string, parentId?: string): Thenable<string | null | undefined | void>
}

export interface InjectionUsageRecord {
  import: Import,
  count: number
  moduleIds: string[]
}

export interface UnimportMeta {
  injectionUsage: Record<string, InjectionUsageRecord>
}

export interface AddonsOptions {
  /**
   * Enable auto import inside for Vue's <template>
   *
   * @default false
   */
  vueTemplate?: boolean
}

export interface UnimportOptions extends Pick<InjectImportsOptions, 'injectAtEnd' | 'mergeExisting'> {
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
   * Unimport Addons
   * To use built-in addons, use `addons: { vueTemplate: true }`
   *
   * Built-in addons:
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
  resolveId?: (id: string, importee?:string) => Thenable<string | void>

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

  /** @deprecated use `virtualImports` instead */
  transformVirtualImoports?: boolean

  /**
   * Inject the imports at the end of other imports
   *
   * @default false
   */
  injectAtEnd?: boolean
}

export type Thenable<T> = Promise<T> | T

export interface Addon {
  transform?: (this: UnimportContext, code: MagicString, id: string | undefined) => Thenable<MagicString>
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
}
