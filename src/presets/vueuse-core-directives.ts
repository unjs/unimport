import type { InlinePreset } from '../types'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { resolveModule } from 'local-pkg'
import { defineUnimportPreset } from '../utils'

export interface VueUseCoreDirectivesOptions {
  /**
   * Prefix VueUse core directives (to allow use other directives with the same name from another packages):
   *
   * When the prefix is enabled, the preset will configure `Vueuse` => `v-vueuse-<directive>: `v-vueuse-on-click-outside`.
   */
  prefix?: true
}

/* c8 ignore start */
export function VueUseCoreDirectives(options: VueUseCoreDirectivesOptions = {}): InlinePreset {
  let _cache: InlinePreset | undefined
  if (!_cache) {
    try {
      const corePath = resolveModule('@vueuse/core') || process.cwd()
      const path = resolveModule('@vueuse/core/indexes.json')
        || resolveModule('@vueuse/metadata/index.json')
        || resolveModule('@vueuse/metadata/index.json', { paths: [corePath] })
      const indexesJson = JSON.parse(readFileSync(path!, 'utf-8'))
      _cache = defineUnimportPreset({
        from: '@vueuse/components',
        meta: { vueDirective: true },
        imports: indexesJson
          .functions
          .filter((i: any) => i.directive && i.name)
          // name is the component name, we need to use the directive name
          .map(({ name, docs }: any) => ({
            name: `v${name[0].toUpperCase()}${name.slice(1)}`,
            as: options.prefix ? `vVueuse${name[0].toUpperCase()}${name.slice(1)}` : undefined,
            meta: { docsUrl: docs },
          })),
      })
    }
    catch (error) {
      console.error(error)
      throw new Error('[auto-import] failed to load @vueuse/core, have you installed it?')
    }
  }

  return _cache
}
/* c8 ignore end */
