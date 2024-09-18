import type { Addon, UnimportOptions } from '../types'
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

    if (opts.addons?.vueDirectives) {
      if (!addonsMap.has(VUE_DIRECTIVES_NAME)) {
        addonsMap.set(VUE_DIRECTIVES_NAME, vueDirectivesAddon(
          typeof opts.addons.vueDirectives === 'object'
            ? opts.addons.vueDirectives
            : undefined,
        ))
      }
    }

    addons.push(...addonsMap.values())
  }

  return addons
}
