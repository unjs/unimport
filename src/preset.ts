import { BuiltinPresetName, builtinPresets } from './presets'
import type { Preset, Import, ImportCommon } from './types'

const commonProps: (keyof ImportCommon)[] = ['from', 'priority', 'disabled']

export function resolvePreset (preset: Preset): Import[] {
  const imports: Import[] = []

  const common = {} as ImportCommon
  commonProps.forEach((i) => {
    if (i in preset) {
      // @ts-expect-error
      common[i] = preset[i]
    }
  })

  for (const _import of preset.imports) {
    if (typeof _import === 'string') {
      imports.push({ ...common, name: _import, as: _import })
    } else if (Array.isArray(_import)) {
      imports.push({ ...common, name: _import[0], as: _import[1] || _import[0], from: _import[2] || preset.from })
    } else if ((_import as Preset).imports) {
      imports.push(...resolvePreset(_import as Preset))
    } else {
      imports.push({ ...common, ..._import as Import })
    }
  }
  return imports
}

export function resolveBuiltinPresets (presets: (BuiltinPresetName | Preset)[]): Import[] {
  return presets.flatMap((p) => {
    let preset = typeof p === 'string' ? builtinPresets[p] : p
    if (typeof preset === 'function') {
      preset = preset()
    }
    return resolvePreset(preset)
  })
}
