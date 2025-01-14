import type { Addon, Import } from '../src'
import { kebabCase } from 'scule'

export function functionWrapAddon(): Addon {
  return {
    injectImportsResolved(imports) {
      return imports
        .map((i) => {
          if (i.from === 'vue') {
            return {
              ...i,
              meta: {
                originalAs: (i.as || i.name),
              },
              as: `_$_${i.as || i.name}`,
            }
          }
          return i
        })
    },
    injectImportsStringified(str, imports) {
      const injected = imports.filter(i => i.meta?.originalAs)
      if (injected.length) {
        return [
          str,
          'import { __helper } from "helper"',
          injected.map(i => `const ${i.meta!.originalAs} = __helper(${i.as})`).join('\n'),
          '',
        ].join('\n')
      }
    },
  }
}

export function resolverAddon(): Addon {
  return {
    name: 'resolver',
    async matchImports(names, matched) {
      const dynamic: Import[] = []
      for (const name of names) {
        if (!name.match(/^El[A-Z]/))
          continue
        dynamic.push({
          name,
          from: `element-plus/es`,
        }, {
          name: 'default',
          as: '',
          from: `element-plus/es/components/${kebabCase(name.slice(2))}/style/index`,
        })
      }
      return [...matched, ...dynamic]
    },
  }
}
