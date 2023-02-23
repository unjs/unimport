import { expect, describe, it } from 'vitest'
import { resolvePreset } from '../src/preset'

describe('auto-extract', () => {
  it('h3', async () => {
    const result1 = await resolvePreset({
      package: 'h3',
      cache: false,
      ignore: ['isStream', /^[A-Z]/, /^[a-z]*$/, r => r.length > 8]
    })

    const result2 = await resolvePreset({
      package: 'h3',
      ignore: ['isStream', /^[A-Z]/, /^[a-z]*$/, r => r.length > 8]
    })

    expect(result1).toEqual(result2)
    expect(
      result1.slice(0, 5)
    ).toMatchInlineSnapshot(`
      [
        {
          "from": "h3",
          "name": "appendCorsHeaders",
        },
        {
          "from": "h3",
          "name": "appendCorsPreflightHeaders",
        },
        {
          "from": "h3",
          "name": "appendHeader",
        },
        {
          "from": "h3",
          "name": "appendHeaders",
        },
        {
          "from": "h3",
          "name": "appendResponseHeader",
        },
      ]
    `)
  })
})
