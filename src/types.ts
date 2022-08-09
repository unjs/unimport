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
}

export interface Import extends ImportCommon {
  /** Import name to be detected */
  name: ImportName
  /** Import as this name */
  as?: ImportName
}

export type PresetImport = ImportName | [name: ImportName, as?: ImportName, from?: ModuleId] | Exclude<Import, 'from'>

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
  staticImports: Import[]
  dynamicImports: Import[]
  getImports(): Promise<Import[]>
  getImportMap(): Promise<Map<string, Import>>
  addons: Addon[]
  invalidate(): void
  resolveId(id: string, parentId?: string): Thenable<string | null | undefined | void>
  options: Partial<UnimportOptions>
}

export interface AddonsOptions {
  /**
   * Enable auto import inside for Vue's <template>
   *
   * @default false
   */
  vueTemplate?: boolean
}

export interface UnimportOptions {
  imports: Import[]
  presets: (Preset | BuiltinPresetName)[]
  warn: (msg: string) => void
  addons: AddonsOptions | Addon[]
  virtualImports: string[]
  /**
   * Custom resolver to auto import id
   */
  resolveId?: (id: string, importee?:string) => Thenable<string | void>
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
}

export interface InjectImportsOptions {
  /**
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
  transformVirtualImoports?: boolean
}

export type Thenable<T> = Promise<T> | T

export interface Addon {
  transform?: (this: UnimportContext, code: MagicString, id: string | undefined) => Thenable<MagicString>
  declaration?: (this: UnimportContext, dts: string, options: TypeDeclarationOptions) => Thenable<string>
  matchImports?: (this: UnimportContext, identifiers: Set<string>, matched: Import[]) => Thenable<Import[] | void>
}
