import type { FilterPattern } from 'unplugin-utils'
import type { UnimportOptions } from './types'

import { promises as fs } from 'node:fs'
import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'
import { createFilter } from 'unplugin-utils'
import { createUnimport } from './context'

export interface UnimportPluginOptions extends UnimportOptions {
  include: FilterPattern
  exclude: FilterPattern
  dts: boolean | string
  /**
   * Enable implicit auto import.
   * Generate global TypeScript definitions.
   *
   * @default true
   */
  autoImport?: boolean
}

export const defaultIncludes = [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/]
export const defaultExcludes = [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]

function toArray<T>(x: T | T[] | undefined | null): T[] {
  return x == null ? [] : Array.isArray(x) ? x : [x]
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options = {}) => {
  const ctx = createUnimport(options)
  const filter = createFilter(
    toArray(options.include as string[] || []).length
      ? options.include
      : defaultIncludes,
    options.exclude || defaultExcludes,
  )
  const dts = options.dts === true
    ? 'unimport.d.ts'
    : options.dts

  const {
    autoImport = true,
  } = options

  return {
    name: 'unimport',
    enforce: 'post',
    transformInclude(id) {
      return filter(id)
    },
    async transform(code, id) {
      const s = new MagicString(code)

      await ctx.injectImports(s, id, {
        autoImport,
      })

      if (!s.hasChanged())
        return

      return {
        code: s.toString(),
        map: s.generateMap(),
      }
    },
    async buildStart() {
      await ctx.init()

      if (dts)
        return fs.writeFile(dts, await ctx.generateTypeDeclarations(), 'utf-8')
    },
    async buildEnd() {
      const typeOptionsReportMatched = Object.prototype.toString.call(options.reportMatchedOptions)
      if (
        'reportMatchedOptions' in options && typeOptionsReportMatched === '[object Object]'
      ) {
        return ctx.reportMatched(options.reportMatchedOptions!)
      } else {
        throw new Error(`\`reportMatchedOptions\` should be an Object, \`${typeOptionsReportMatched}\` is given`)
      }
    },
  }
})
