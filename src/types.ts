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

export interface Preset extends ImportCommon {
  imports: (PresetImport | Preset)[]
}

export interface UnimportContext {
  readonly imports: Import[]
  staticImports: Import[]
  dynamicImports: Import[]
  map: Map<string, Import>
  addons: Addon[]
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
}

export type PathFromResolver = (_import: Import) => string | undefined

export interface ScanDirExportsOptions {
  fileFilter?: (file: string) => boolean
}

export interface TypeDeclrationOptions {
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
}

export type Thenable<T> = Promise<T> | T

export interface Addon {
  transform?: (this: UnimportContext, code: MagicString, id: string | undefined) => Thenable<MagicString>
  decleration?: (this: UnimportContext, dts: string, options: TypeDeclrationOptions) => string
  matchImports?: (this: UnimportContext, scannedNames: Set<string>, matched: Import[]) => Thenable<Import[] | void>
}
