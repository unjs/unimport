import { describe, expect, it } from 'vitest'
import { createUnimport, installGlobalAutoImports } from '../src'

describe('global', () => {
  it('basic', async () => {
    const unimport = createUnimport({
      imports: [
        { name: 'default', from: 'jquery', as: '$' }
      ],
      presets: [
        {
          from: 'vue',
          imports: ['ref', 'reactive', 'computed']
        }
      ]
    })

    const fakeGlobal: any = {}

    await installGlobalAutoImports(unimport, { globalObject: fakeGlobal })

    expect(Object.keys(fakeGlobal).sort()).toMatchInlineSnapshot(`
      [
        "$",
        "computed",
        "reactive",
        "ref",
      ]
    `)
    expect(fakeGlobal.ref(1).value).toBe(1)
    expect(fakeGlobal.computed(() => 1 + 2).value).toBe(3)
    expect(typeof fakeGlobal.$).toBe('function')
  })
})
