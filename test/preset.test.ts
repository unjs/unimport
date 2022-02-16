import { expect, describe, test } from 'vitest'
import { defineUnimportPreset, resolvePreset } from '../src/preset'

describe('preset', () => {
  test('resolve', () => {
    expect(
      resolvePreset(defineUnimportPreset({
        from: 'vue',
        imports: [
          'ref',
          'reactive',
          // alias
          ['ref', 'ref2'],
          ['computed'],
          // full options
          {
            name: 'toRefs',
            from: 'vue-alias'
          },
          // nested preset
          {
            from: 'vue-nested',
            imports: [
              'toRef'
            ]
          }
        ]
      }))
    ).toMatchInlineSnapshot(`
      [
        {
          "as": "ref",
          "from": "vue",
          "name": "ref",
        },
        {
          "as": "reactive",
          "from": "vue",
          "name": "reactive",
        },
        {
          "as": "ref2",
          "from": "vue",
          "name": "ref",
        },
        {
          "as": "computed",
          "from": "vue",
          "name": "computed",
        },
        {
          "from": "vue-alias",
          "name": "toRefs",
        },
        {
          "as": "toRef",
          "from": "vue-nested",
          "name": "toRef",
        },
      ]
    `)
  })
})
