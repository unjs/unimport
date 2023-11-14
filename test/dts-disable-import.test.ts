import { describe, expect, it } from 'vitest'
import type { Import } from '../src'
import { createUnimport } from '../src'

describe('disable import in dts generation', () => {
  const imports: Import[] = [
    {
      name: 'foo',
      from: 'test-id',
    },
    {
      name: 'bar',
      from: 'test-id',
      dtsDisabled: true,
    },
  ]

  const unimport = createUnimport({
    imports,
  })

  it('filters import out', async () => {
    const dts = await unimport.generateTypeDeclarations()
    expect(dts).toContain('foo')
    expect(dts).not.toContain('bar')
  })
})
