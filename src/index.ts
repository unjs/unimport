export { version } from '../package.json'
export { vueTemplateAddon } from './addons/vue-template'
export { createUnimport } from './context'
export { installGlobalAutoImports } from './global'

export * from './node/scan-dirs'
export {
  resolveBuiltinPresets,
  resolvePreset,
} from './preset'
export { builtinPresets, VueUseCoreDirectives } from './presets'
export type { BuiltinPresetName, VueUseCoreDirectivesOptions } from './presets'

export * from './regexp'

export * from './types'

export * from './utils'
