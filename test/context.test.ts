import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'

describe('context', () => {
  it('should not re-export types', async () => {
    const unimport = createUnimport({
      imports: [
        { name: 'default', from: 'jquery', as: '$' },
        { name: 'foo', from: 'foo', as: 'disabled', disabled: true },
        { name: 'FOO', from: 'vue', type: true }
      ],
      presets: [
        {
          from: 'vue',
          imports: ['ref', 'reactive', 'computed', { name: 'Ref', type: true }]
        }
      ]
    })

    expect(await unimport.toExports()).toMatchInlineSnapshot(`
      "export { ref, reactive, computed } from 'vue';
      export { default as $ } from 'jquery';"
    `)
  })
})
