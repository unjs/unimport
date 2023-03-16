import { expect, describe, it } from 'vitest'
import { resolvePreset, resolveBuiltinPresets } from '../src/preset'
import { defineUnimportPreset } from '../src/utils'

describe('preset', () => {
  it('resolve', async () => {
    expect(
      await resolvePreset(defineUnimportPreset({
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
            ],
            disabled: true
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
          "disabled": true,
          "from": "vue-nested",
          "name": "toRef",
        },
      ]
    `)
  })

  it('built-in presets', async () => {
    expect(
      await resolveBuiltinPresets([
        'vue-router'
      ])
    ).toMatchInlineSnapshot(`
      [
        {
          "as": "useRouter",
          "from": "vue-router",
          "name": "useRouter",
        },
        {
          "as": "useRoute",
          "from": "vue-router",
          "name": "useRoute",
        },
        {
          "as": "useLink",
          "from": "vue-router",
          "name": "useLink",
        },
        {
          "as": "onBeforeRouteLeave",
          "from": "vue-router",
          "name": "onBeforeRouteLeave",
        },
        {
          "as": "onBeforeRouteUpdate",
          "from": "vue-router",
          "name": "onBeforeRouteUpdate",
        },
      ]
    `)
  })

  it('resolve with meta', async () => {
    expect(
      await resolvePreset(defineUnimportPreset({
        from: 'vue',
        imports: [
          'ref',
          {
            name: 'toRefs',
            from: 'vue-alias',
            meta: {
              docsUrl: 'https://vuejs.org/api/reactivity-utilities.html#torefs'
            }
          }
        ],
        meta: {
          docsUrl: 'https://vuejs.org'
        }
      }))
    ).toMatchInlineSnapshot(`
      [
        {
          "as": "ref",
          "from": "vue",
          "meta": {
            "docsUrl": "https://vuejs.org",
          },
          "name": "ref",
        },
        {
          "from": "vue-alias",
          "meta": {
            "docsUrl": "https://vuejs.org/api/reactivity-utilities.html#torefs",
          },
          "name": "toRefs",
        },
      ]
    `)
  })
})
