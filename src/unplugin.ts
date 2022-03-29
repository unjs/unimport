import { promises as fs } from 'fs'
import { createUnplugin } from 'unplugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'
import { UnimportOptions } from './types'
import { createUnimport } from './context'
import { scanDirExports } from './scan'
import { vueTemplateAutoImport } from './vue-sfc'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern
  exclude: FilterPattern
  dts: boolean | string
  dirs: string[]
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
    async transform (_code, id) {
      if (id.endsWith('.vue')) {
        _code = vueTemplateAutoImport(_code, ctx)
      }

      const { code, s } = await ctx.injectImports(_code)
      if (code === _code) {
        return
      }
      return {
        code,
        map: s.generateMap()
      }
    },
    async buildStart () {
      if (options.dirs?.length) {
        await ctx.modifyDynamicImports(async (imports) => {
          imports.push(...await scanDirExports(options.dirs))
        })
      }

      if (dts) {
        return fs.writeFile(dts, ctx.generateTypeDecarations(), 'utf-8')
      }
    }
  }
})
