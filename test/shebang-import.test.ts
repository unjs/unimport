import { describe, expect, it } from 'vitest'
import { createUnimport } from '../src'

describe('shebang-import', () => {
  it('should insert imports after shebang code', async () => {
    const code = `#!/usr/bin/env node
console.log(fooBar())
`
    const { injectImports } = createUnimport({
      imports: [{ name: 'fooBar', from: 'test-id' }],
    })

    const output = (await injectImports(code)).code
    expect(output)
      .toMatchInlineSnapshot(`
      "#!/usr/bin/env node

      import { fooBar } from 'test-id';
      console.log(fooBar())
      "`)
  })
})
