import type { Preset } from '../types'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { resolveModule } from 'local-pkg'
import { defineUnimportPreset } from '../utils'

let _cache: Preset | undefined

/* c8 ignore start */
export default (): Preset => {
  const excluded = ['toRefs', 'utils']

  if (!_cache) {
    try {
      const corePath = resolveModule('@vueuse/core') || process.cwd()
      const path = resolveModule('@vueuse/core/indexes.json')
        || resolveModule('@vueuse/metadata/index.json')
        || resolveModule('@vueuse/metadata/index.json', { paths: [corePath] })
      const indexesJson = JSON.parse(readFileSync(path!, 'utf-8'))
      _cache = defineUnimportPreset({
        from: '@vueuse/core',
        imports: indexesJson
          .functions
          .filter((i: any) => ['core', 'shared'].includes(i.package))
          .map((i: any) => i.name as string)
          // only include functions with 4 characters or more
          .filter((i: string) => i && i.length >= 4 && !excluded.includes(i)),
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
