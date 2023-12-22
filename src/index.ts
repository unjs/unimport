export {
  resolveBuiltinPresets,
  resolvePreset,
} from './preset'
export * from './utils'
export * from './regexp'
export * from './types'

export { createUnimport } from './context'
export { installGlobalAutoImports } from './global'
export { builtinPresets } from './presets'
export type { BuiltinPresetName } from './presets'

export * from './node/scan-dirs'

export { vueTemplateAddon } from './addons/vue-template'

export { version } from '../package.json'
