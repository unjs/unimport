import type { UnimportPluginOptions } from '../src/unplugin'
import * as process from 'node:process'
import { resolve } from 'pathe'

const useDirs = process.env.USE_DIRS === 'true'

const unimportViteOptions: Partial<UnimportPluginOptions> = {
  dts: true,
  debugLog(msg) {
    // eslint-disable-next-line no-console
    console.log(msg)
  },
  presets: [
    'vue',
    {
      from: resolve(process.cwd(), 'composables-preset/dummy.ts'),
      imports: [{
        name: 'dummy',
      }],
    },
  ],
  dirs: ['./composables/**'],
  addons: {
    vueTemplate: true,
    vueDirectives: {
      isDirective(normalizeImportFrom, _importEntry) {
        return normalizeImportFrom.includes('/directives/')
      },
    },
  },
}

if (useDirs) {
  unimportViteOptions.dirsScanOptions = {
    cwd: process.cwd().replace(/\\/g, '/'),
  }
  unimportViteOptions.dirs.push('./directives/**')
}
else {
  unimportViteOptions.presets.push(...[{
    from: 'directives/awesome-directive.ts',
    imports: [{
      name: 'default',
      meta: {
        vueDirective: true,
      },
    }],
  }, {
    from: 'directives/named-directive.ts',
    imports: [{
      name: 'NamedDirective',
      meta: {
        vueDirective: true,
      },
    }],
  }, {
    from: 'directives/mixed-directive.ts',
    imports: [{
      name: 'NamedMixedDirective',
      meta: {
        vueDirective: true,
      },
    }, {
      name: 'default',
      as: 'MixedDirective',
      meta: {
        vueDirective: true,
      },
    }],
  }, {
    from: 'directives/custom-directive.ts',
    imports: [{
      name: 'CustomDirective',
      meta: {
        vueDirective: true,
      },
    }],
  }, {
    from: 'directives/ripple-directive.ts',
    imports: [{
      name: 'vRippleDirective',
      meta: {
        vueDirective: true,
      },
    }],
  }, {
    from: 'directives/v-focus-directive.ts',
    imports: [{
      name: 'default',
      as: 'FocusDirective',
      meta: {
        vueDirective: true,
      },
    }],
  }].map((i) => {
    i.from = resolve(process.cwd(), i.from)
    return i
  }))
}

export { unimportViteOptions }
