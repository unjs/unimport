import { Addon } from '../src'

export function functionWrapAddon (): Addon {
  return {
    injectImportsResolved (imports) {
      return imports
        .map((i) => {
          if (i.from === 'vue') {
            return {
              ...i,
              meta: {
                originalAs: (i.as || i.name)
              },
              as: '_$_' + (i.as || i.name)
            }
          }
          return i
        })
    },
    injectImportsStringified (str, imports) {
      const injected = imports.filter(i => i.meta?.originalAs)
      if (injected.length) {
        return [
          str,
          'import { __helper } from "helper"',
          injected.map(i => `const ${i.meta!.originalAs} = __helper(${i.as})`).join('\n'),
          ''
        ].join('\n')
      }
    }
  }
}
