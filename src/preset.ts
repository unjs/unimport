import type { Preset, Import, Resolver, ResolvedPreset } from './types'

export function defineUnimportPreset (preset: Preset): Preset {
  return preset
}

export function resolvePreset (preset: Preset): ResolvedPreset {
  const imports: Import[] = []
  const resolvers: Resolver[] = []
  for (const _import of preset.imports) {
    if (typeof _import === 'string') {
      imports.push({ name: _import, as: _import, from: preset.from })
    } else if (Array.isArray(_import)) {
      imports.push({ name: _import[0], as: _import[1] || _import[0], from: _import[2] || preset.from })
    } else if ((_import as Preset).imports || (_import as Preset).resolvers) {
      const preset = resolvePreset(_import as Preset)
      imports.push(...preset.imports)
      resolvers.push(...preset.resolvers)
    } else {
      imports.push({ from: preset.from, ..._import as Import })
    }
  }
  return {
    imports,
    resolvers
  }
}
