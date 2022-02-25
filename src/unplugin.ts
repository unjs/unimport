import { promises as fs } from 'fs'
import { createUnplugin } from 'unplugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'
import { UnimportOptions } from './types'
import { createUnimport } from './context'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern
  exclude: FilterPattern
  dts: boolean | string
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options) => {
  const ctx = createUnimport(options)
  const filter = createFilter(
    options.include || [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/],
    options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]
  )
  const dts = options.dts === true
    ? 'unimport.d.ts'
    : options.dts
  return {
    name: 'unimport',
    enforce: 'post',
    transformInclude (id) {
      return filter(id)
    },
    transform (_code) {
      const { code, s } = ctx.injectImports(_code)
      if (code === _code) {
        return
      }
      return {
        code,
        map: s.generateMap()
      }
    },
    buildStart () {
      if (dts) {
        return fs.writeFile(dts, ctx.generateTypeDecarations(), 'utf-8')
      }
    }
  }
})
