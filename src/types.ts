export type ModuleId = string
export type ImportName = string

export interface Import {
  /** import name to be imported */
  name: ImportName
  /** Import as this name */
  as?: ImportName
  /** Module specifier to import from */
  from: ModuleId
  /** Other imports required */
  peerImports?: ModuleId[]
}

export type Awaitable<T> = T | PromiseLike<T>
export type Resolver = (name: ImportName) => Awaitable<ImportName | Import | (ImportName | Import)[] | null | undefined>

export type PresetImport = ImportName | [name: ImportName, as?: ImportName, from?: ModuleId] | Exclude<Import, 'from'>

export interface Preset {
  from: ModuleId
  imports?: (PresetImport | Preset)[]
  resolvers?: Resolver[]
}

export interface ResolvedPreset {
  imports: Import[]
  resolvers: Resolver[]
}

export interface UnimportOptions {
  /**
   * @default [/node_modules/]
   */
  exclude: RegExp[]
  imports: Import[]
  presets: Preset[]
  resolvers: Resolver[]
}
