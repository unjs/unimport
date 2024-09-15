import type { Addon, DirectivePreset, InlinePreset, PresetImport, UnimportOptions } from '../types'
import { VUE_DIRECTIVES_NAME, vueDirectivesAddon } from './vue-directives'
import { VUE_TEMPLATE_NAME, vueTemplateAddon } from './vue-template'

export function configureAddons(opts: Partial<UnimportOptions>) {
  const addons: Addon[] = []

  if (Array.isArray(opts.addons)) {
    addons.push(...opts.addons)
  }
  else {
    const addonsMap = new Map<string, Addon>()
    if (opts.addons?.addons?.length) {
      let i = 0
      for (const addon of opts.addons.addons) {
        addonsMap.set(addon.name || `external:custom-${i++}`, addon)
      }
    }

    if (opts.addons?.vueTemplate) {
      if (!addonsMap.has(VUE_TEMPLATE_NAME)) {
        addonsMap.set(VUE_TEMPLATE_NAME, vueTemplateAddon())
      }
    }

    if (!addonsMap.has(VUE_DIRECTIVES_NAME)) {
      const directives: DirectivePreset[] = []
      if (opts.addons?.vueDirectives) {
        directives.push(...(Array.isArray(opts.addons.vueDirectives)
          ? opts.addons.vueDirectives
          : [opts.addons.vueDirectives]),
        )
      }

      // check for vue directives in the presets
      if (opts.presets) {
        for (const preset of opts.presets) {
          if (typeof preset === 'string')
            continue

          if ('vueDirectives' in preset && preset.vueDirectives) {
            directives.push(...(Array.isArray(preset.vueDirectives)
              ? preset.vueDirectives
              : [preset.vueDirectives]),
            )
          }

          if ('imports' in preset)
            traverseImports(directives, preset.imports)
        }
      }

      if (directives.length) {
        addonsMap.set(VUE_DIRECTIVES_NAME, vueDirectivesAddon(directives))
      }
    }
    addons.push(...addonsMap.values())
  }

  return addons
}

function traverseImports(
  directives: DirectivePreset[],
  imports: (PresetImport | InlinePreset)[],
) {
  for (const imp of imports) {
    if (typeof imp === 'string')
      continue

    if ('vueDirectives' in imp && imp.vueDirectives) {
      directives.push(...(Array.isArray(imp.vueDirectives)
        ? imp.vueDirectives
        : [imp.vueDirectives]),
      )
    }

    if ('imports' in imp)
      traverseImports(directives, imp.imports)
  }
}
