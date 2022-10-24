import { describe, expect, it } from 'vitest'
import { createUnimport, installGlobalAutoImports } from '../src'

describe('global', () => {
  it('basic', async () => {
    const unimport = createUnimport({
      imports: [
        { name: 'default', from: 'jquery', as: '$' },
        { name: 'foo', from: 'foo', as: 'disabled', disabled: true }
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

    const fakeGlobal2: any = {}
    await installGlobalAutoImports(await unimport.getImports(), { globalObject: fakeGlobal2 })
    expect(Object.keys(fakeGlobal2).sort())
      .toEqual(Object.keys(fakeGlobal).sort())
  })
})
