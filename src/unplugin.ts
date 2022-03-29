import { promises as fs } from 'fs'
import { createUnplugin } from 'unplugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import { UnimportOptions } from './types'
import { createUnimport } from './context'
import { scanDirExports } from './scan'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern
  exclude: FilterPattern
  dts: boolean | string
  dirs: string[]
  vueTemplate: boolean
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options = {}) => {
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
      const s = new MagicString(_code)

      await ctx.injectImports(s, {
        vueTemplate: options.vueTemplate && id.endsWith('.vue')
      })

      if (!s.hasChanged()) {
        return
      }
      return {
        code: s.toString(),
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
