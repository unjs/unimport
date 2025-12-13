import { describe, expect, it } from 'vitest'
import { excludeRE, importAsRE, separatorRE, stripCommentsAndStrings } from '../src/regexp'

describe('regex for extract local variable', () => {
  const cases: { input: string, output: string[] }[] = [
    { input: 'const b;', output: ['b'] },
    { input: 'const { ref,    computed,watch} = Vue', output: ['ref', 'computed', 'watch'] },
    { input: 'const {  } = Vue', output: [] },
    { input: 'const { ref} = Vue', output: ['ref'] },
    { input: 'const { maybe_test, $test} = Vue', output: ['maybe_test', '$test'] },
    { input: 'const [state] = useState(1)', output: ['state'] },
    { input: 'for (const [index, value] of list.entries()) {}', output: ['index', 'value'] },

    // We may not able to handle these cases
    //     { input: 'const b = computed(0)  ,   test=1;', output: ['b', 'test'] },
    //     {
    //       input: `const b = computed(0)  ,
    // test=1;`,
    //       output: ['b', 'test']
    //     },
    //     {
    //       input: `const b = computed(0)  ,
    // test=1,test2;`,
    //       output: ['b', 'test', 'test2']
    //     },
    //     {
    //       input: `const b = computed(0)  ,
    // test=1,test2=3`,
    //       output: ['b', 'test', 'test2']
    //     }
  ]

  for (const item of cases) {
    it(item.input, () => {
      const strippedCode = stripCommentsAndStrings(item.input)
      const identifiers: string[] = []

      for (const match of strippedCode.matchAll(excludeRE[3])) {
        const segments = [...match[1]?.split(separatorRE) || [], ...match[2]?.split(separatorRE) || []]
        for (const segment of segments) {
          const identifier = segment.replace(importAsRE, '').trim()
          identifiers.push(identifier)
        }
      }
      const result = identifiers.filter(Boolean).filter(i => i !== 'const')
      expect(result).toEqual(item.output)
    })
  }
})

describe('regex for extract imported/exported variables', () => {
  const cases: { input: string, output: string[] }[] = [
    { input: `import { ref,    computed as foo,watch} from "vue"`, output: ['ref', 'foo', 'watch'] },
    { input: `import {  }from 'vue'`, output: [] },
    { input: `export {  }from 'vue'`, output: [] },
    { input: `export{ref, watch} from 'vue'`, output: ['ref', 'watch'] },
    { input: `export{ref as bar} from 'vue'`, output: ['bar'] },
    { input: `export{ref}from'vue'`, output: ['ref'] },
    { input: `export{ref,watch}from'vue'`, output: ['ref', 'watch'] },
    { input: `export{from}from'rxjs'`, output: ['from'] },
  ]
  for (const item of cases) {
    it(item.input, () => {
      const strippedCode = stripCommentsAndStrings(item.input)
      const identifiers: string[] = []

      for (const match of strippedCode.matchAll(excludeRE[0])) {
        const segments = [...match[1]?.split(separatorRE) || [], ...match[2]?.split(separatorRE) || []]
        for (const segment of segments) {
          const identifier = segment.replace(importAsRE, '').trim()
          identifiers.push(identifier)
        }
      }
      const result = identifiers.filter(Boolean)
      expect(result).toEqual(item.output)
    })
  }
})
