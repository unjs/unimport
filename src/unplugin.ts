import { createUnplugin } from 'unplugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'
import { UnimportOptions } from './types'
import { createUnimport } from './index'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern,
  exclude: FilterPattern,
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options) => {
  const ctx = createUnimport(options)
  const filter = createFilter(
    options.include || [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/],
    options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]
  )
  return {
    name: 'unimport',
    transform (_code, id) {
      if (!filter(id)) {
        return
      }
      const { code, s } = ctx.addImports(_code)
      if (code === _code) {
        return
      }
      return {
        code,
        map: s.generateMap()
      }
    },
    buildStart () {
      // TODO: ctx.generateTypeDecarations()
    }
  }
})
