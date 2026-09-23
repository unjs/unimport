import { describe, expect, it } from 'vitest'
import Unimport from '../src/unplugin'

const id = '/src/a.ts'
const code = [
  'export function classify(n) {',
  '  const h = helper();',
  '  if (n > 10) return h.big;',
  '  if (n > 0) return h.small;',
  '  return h.zero;',
  '}',
  '',
].join('\n')

function createPlugin() {
  return Unimport.raw(
    {
      imports: [{ name: 'helper', from: 'my-lib' }],
    },
    { framework: 'vite', versions: {} },
  )
}

async function transform(input: string, fileId = id) {
  const hook = createPlugin().transform
  const handler = typeof hook === 'function' ? hook : hook!.handler
  return handler.call(
    {} as never,
    input,
    fileId,
  ) as Promise<{ code: string, map: { mappings: string, sources: string[] } } | undefined>
}

/**
 * Sourcemap `mappings` are grouped by generated line (`;`), then by segment
 * (`,`). A line-only map has one segment per line, all at column 0.
 */
function segmentsPerLine(mappings: string) {
  return mappings.split(';').map(line => (line === '' ? 0 : line.split(',').length))
}

describe('unplugin', () => {
  it('injects auto-imports and emits a column-accurate sourcemap', async () => {
    const result = await transform(code)

    expect(result?.code).toContain(`import { helper } from 'my-lib';`)
    expect(result?.map.sources).toEqual([id])
    // Bare generateMap() emits one mapping per line. V8 coverage then drops
    // the file and reports 100% (0/0). See https://github.com/unjs/unimport/issues/562
    expect(Math.max(...segmentsPerLine(result!.map.mappings))).toBeGreaterThan(1)
  })

  it('skips files that do not use auto-imports', async () => {
    expect(await transform('export const one = 1;\n')).toBeUndefined()
  })
})
