import { createUnplugin } from 'unplugin'
import { UnimportOptions } from './types'
import { createUnimport } from './index'

export interface UnimportPluginOptions extends UnimportOptions {
  // TODO: add configurable include/exclude transform target
}

export default createUnplugin<Partial<UnimportPluginOptions>>((options) => {
  const ctx = createUnimport(options)
  return {
    name: 'unimport',
    transform (_code, id) {
      if (id.match(/\/node_modules\//)) {
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
