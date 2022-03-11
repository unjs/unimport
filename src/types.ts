import type { BuiltinPresetName } from './presets'

export type ModuleId = string
export type ImportName = string

export interface Import {
  /** import name to be imported */
  name: ImportName
  /** Import as this name */
  as?: ImportName
  /** Module specifier to import from */
  from: ModuleId
  /**
   * Priority of the import, if multiple imports have the same name, the one with the highest priority will be used
   * @default 1
   */
  priority?: number
}

export type PresetImport = ImportName | [name: ImportName, as?: ImportName, from?: ModuleId] | Exclude<Import, 'from'>

export interface Preset {
  from: ModuleId
  imports: (PresetImport | Preset)[]
  priority?: number
}

export interface UnimportOptions {
  imports: Import[]
  presets: (Preset | BuiltinPresetName)[]
  warn: (msg: string) => void
}

export type PathFromResolver = (_import: Import) => string | undefined
