import { beforeEach, describe, expect, it } from 'vitest'
import { dedupeImports } from '../src/utils'

describe('dedupeImports', () => {
  let warnMsg = ''
  const warnFn = (msg: string) => {
    warnMsg = msg
  }

  beforeEach(() => {
    warnMsg = ''
  })

  it('later should have hight priority', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1'
        },
        {
          name: 'foo',
          from: 'module2'
        }
      ],
      warnFn
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module2",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('"Duplicated imports \\"foo\\", the one from \\"module1\\" has been ignored"')
  })

  it('respect explit priority', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1'
        },
        {
          name: 'foo',
          from: 'module2',
          priority: 2
        },
        {
          name: 'foo',
          from: 'module3',
          priority: 1
        }
      ],
      warnFn
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module2",
          "name": "foo",
          "priority": 2,
        },
      ]
    `)
  })

  it('should not warn about duplicates when one is disabled', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
          disabled: true
        },
        {
          name: 'foo',
          from: 'module2'
        }
      ],
      warnFn
    )).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "from": "module1",
          "name": "foo",
        },
        {
          "from": "module2",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('""')
  })

  it('should dedupe some from', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1'
        },
        {
          name: 'foo',
          from: 'module1'
        }
      ],
      warnFn
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module1",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('""')
  })
})
