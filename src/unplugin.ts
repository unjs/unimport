import type { RolldownPlugin, UnpluginOptions } from 'unplugin'
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
  /**
   * Let Rolldown add the auto-imports through `transform.inject`, so most modules skip the JS transform.
   * Needs a Rolldown version with `transform.injectFilter`.
   * Only applies to Rolldown builds and to `vite build` on Rolldown. `vite` dev keeps the JS transform.
   *
   * @default false
   */
  nativeInject?: boolean
}

export const defaultIncludes = [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/]
export const defaultExcludes = [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]

type TransformHook = Extract<NonNullable<UnpluginOptions['transform']>, { handler: unknown }>
type RolldownOptionsHook = NonNullable<RolldownPlugin['options']>

function toArray<T>(x: T | T[] | undefined | null): T[] {
  return x == null ? [] : Array.isArray(x) ? x : [x]
}

export default createUnplugin<Partial<UnimportPluginOptions>, false>((options = {}, meta) => {
  const ctx = createUnimport(options)
  const include = toArray(options.include as string[] || []).length
    ? options.include!
    : defaultIncludes
  const exclude = options.exclude || defaultExcludes
  const filter = createFilter(include, exclude)
  const dts = options.dts === true
    ? 'unimport.d.ts'
    : options.dts

  const {
    autoImport = true,
    nativeInject = false,
  } = options

  const transform: TransformHook = {
    async handler(code, id) {
      const s = new MagicString(code)

      await ctx.injectImports(s, id, {
        autoImport,
      })

      if (!s.hasChanged())
        return

      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary', source: id }),
      }
    },
  }

  let isViteServe = false

  const setupNativeInject: RolldownOptionsHook = async function (inputOptions) {
    // Rolldown reads hook filters after the `options` hook, so `transform.filter` can still change here.
    transform.filter = undefined
    if (!nativeInject || isViteServe || !(meta.framework === 'rolldown' || this.meta.rolldownVersion))
      return

    // TODO: drop the cast once the `rolldown` dev dependency has `transform.injectFilter`
    const transformOptions = inputOptions.transform as { inject?: Record<string, unknown>, injectFilter?: unknown } | undefined
    if (transformOptions?.injectFilter) {
      this.warn('`nativeInject` is ignored because `transform.injectFilter` is already set')
      return
    }

    await ctx.init()
    const native = await ctx.getNativeInject()
    if (!native)
      return

    // `{ exclude: /^/ }` skips every module
    transform.filter = { code: native.transformFilter ?? { exclude: /^/ } }
    return {
      ...inputOptions,
      transform: {
        ...transformOptions,
        inject: { ...native.inject, ...transformOptions?.inject },
        injectFilter: { include, exclude },
      } as typeof inputOptions.transform,
    }
  }

  return {
    name: 'unimport',
    enforce: 'post',
    transformInclude(id) {
      return filter(id)
    },
    transform,
    rolldown: {
      options: setupNativeInject,
    },
    vite: {
      configResolved(config) {
        isViteServe = config.command === 'serve'
      },
      options: setupNativeInject,
    },
    async buildStart() {
      await ctx.init()

      if (dts)
        return fs.writeFile(dts, await ctx.generateTypeDeclarations(), 'utf-8')
    },
  }
})
