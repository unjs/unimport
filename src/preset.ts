import type { BuiltinPresetName } from './presets'
import type { Import, ImportCommon, InlinePreset, Preset } from './types'

import { resolvePackagePreset } from './node/extract-package'
import { builtinPresets } from './presets'

/**
 * Common propreties for import item and preset
 */
const commonProps: (keyof ImportCommon)[] = [
  'from',
  'priority',
  'disabled',
  'dtsDisabled',
  'meta',
  'type',
]

export async function resolvePreset(preset: Preset): Promise<Import[]> {
  const imports: Import[] = []

  if ('package' in preset)
    return await resolvePackagePreset(preset)

  const common = {} as ImportCommon
  commonProps.forEach((i) => {
    if (i in preset) {
      // @ts-expect-error type cast
      common[i] = preset[i]
    }
  })

  for (const _import of preset.imports) {
    if (typeof _import === 'string')
      imports.push({ ...common, name: _import, as: _import })
    else if (Array.isArray(_import))
      imports.push({ ...common, name: _import[0], as: _import[1] || _import[0], from: _import[2] || preset.from })
    else if ((_import as InlinePreset).imports)
      imports.push(...await resolvePreset(_import as Preset))
    else
      imports.push({ ...common, ..._import as Import })
  }
  return imports
}

export async function resolveBuiltinPresets(presets: (BuiltinPresetName | Preset)[]): Promise<Import[]> {
  const resolved = await Promise.all(presets.map(async (p) => {
    let preset = typeof p === 'string' ? builtinPresets[p] : p
    if (typeof preset === 'function')
      preset = preset()

    return await resolvePreset(preset)
  }))
  return resolved.flat()
}
