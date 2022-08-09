import { promises as fs } from 'fs'
import { createUnplugin } from 'unplugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import { UnimportOptions } from './types'
import { createUnimport } from './context'
import { scanDirExports } from './scan-dirs'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern
  exclude: FilterPattern
  dts: boolean | string
  dirs: string[]
}

export const defaultIncludes = [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/]
export const defaultExcludes = [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]

function toArray<T> (x: T | T[] | undefined | null): T[] {
  return x == null ? [] : Array.isArray(x) ? x : [x]
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options = {}) => {
  const ctx = createUnimport(options)
  const filter = createFilter(
    toArray(options.include as string[] || []).length ? options.include : defaultIncludes,
    options.exclude || defaultExcludes
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
    async transform (code, id) {
      const s = new MagicString(code)

      await ctx.injectImports(s, id)

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
          imports.push(...await scanDirExports(options.dirs!))
        })
      }

      if (dts) {
        return fs.writeFile(dts, await ctx.generateTypeDeclarations(), 'utf-8')
      }
    }
  }
})
