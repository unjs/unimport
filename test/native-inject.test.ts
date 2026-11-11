import type { Import } from '../src'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createUnimport } from '../src'
import Unimport from '../src/unplugin'

describe('getNativeInject', () => {
  it('maps imports to `transform.inject` entries', async () => {
    const { getNativeInject } = createUnimport({
      imports: [
        { name: 'ref', from: 'vue' },
        { name: 'default', as: 'dayjs', from: 'dayjs' },
        { name: '*', as: 'path', from: 'pathe' },
        { name: '=', as: 'browser', from: 'webextension-polyfill' },
        { name: 'useFoo', as: 'useBar', from: '~/foo' },
        { name: 'Ref', from: 'vue', type: true },
        { name: 'data', from: './data.json', with: { type: 'json' } },
        { name: 'off', from: 'off', disabled: true },
      ],
    })

    const native = await getNativeInject()
    expect(native?.inject).toEqual({
      ref: ['vue', 'ref'],
      dayjs: 'dayjs',
      path: ['pathe', '*'],
      browser: 'webextension-polyfill',
      useBar: ['~/foo', 'useFoo'],
    })
    expect(native?.transformFilter?.test('const x = data')).toBe(true)
    expect(native?.transformFilter?.test('const x = obj.data')).toBe(false)
    expect(native?.transformFilter?.test('const x = database')).toBe(false)
  })

  it('leaves no transform filter when every import can be injected', async () => {
    const native = await createUnimport({ imports: [{ name: 'ref', from: 'vue' }] }).getNativeInject()
    expect(native?.transformFilter).toBeUndefined()
  })

  it('keeps virtual imports, templates and directives on the JS transform', async () => {
    const native = await createUnimport({
      imports: [{ name: 'ref', from: 'vue' }],
      virtualImports: ['#imports'],
      addons: { vueTemplate: true, vueDirectives: true },
    }).getNativeInject()

    const filter = native!.transformFilter!
    expect(filter.test(`import { ref } from '#imports'`)).toBe(true)
    expect(filter.test('return _ctx.ref')).toBe(true)
    expect(filter.test('import { resolveDirective as _resolveDirective } from "vue"')).toBe(true)
    expect(filter.test('const a = ref(1)')).toBe(false)
  })

  it('returns undefined when every module needs the JS transform', async () => {
    const imports: Import[] = [{ name: 'ref', from: 'vue' }]
    expect(await createUnimport({ imports, resolveId: id => id }).getNativeInject()).toBeUndefined()
    expect(await createUnimport({ imports, addons: [{ transform: s => s }] }).getNativeInject()).toBeUndefined()
    expect(await createUnimport({ imports, addons: [{ matchImports: () => {} }] }).getNativeInject()).toBeUndefined()
  })
})

// `rolldown-inject-filter` is a Linux x64 build of https://github.com/rolldown/rolldown/pull/11290
describe.skipIf(process.platform !== 'linux' || process.arch !== 'x64')('unplugin nativeInject with Rolldown', () => {
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'unimport-native-inject-'))
    const files: Record<string, string> = {
      'utils.ts': `export function helper() { return 'helper' }\nexport default function greet() { return 'hi' }\n`,
      'ns.ts': `export const value = 1\n`,
      'main.ts': [
        '// @unimport-debug',
        `import { other } from './other'`,
        `import dep from 'dep'`,
        'export default [helper(), greet(), ns.value, other(), dep()]',
      ].join('\n'),
      'other.ts': [
        '// @unimport-debug',
        `import { helper } from '#imports'`,
        'export const other = () => helper()',
      ].join('\n'),
      'node_modules/dep/package.json': JSON.stringify({ name: 'dep', type: 'module', main: 'index.js' }),
      'node_modules/dep/index.js': '// @unimport-debug\nexport default () => typeof helper\n',
    }
    for (const [file, content] of Object.entries(files)) {
      await mkdir(join(dir, file, '..'), { recursive: true })
      await writeFile(join(dir, file), content)
    }
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function build(nativeInject: boolean) {
    const { rolldown } = await import('rolldown-inject-filter')
    const logs: string[] = []
    const bundle = await rolldown({
      cwd: dir,
      input: join(dir, 'main.ts'),
      plugins: [Unimport.rolldown({
        nativeInject,
        virtualImports: ['#imports'],
        imports: [
          { name: 'helper', from: join(dir, 'utils.ts') },
          { name: 'default', as: 'greet', from: join(dir, 'utils.ts') },
          { name: '*', as: 'ns', from: join(dir, 'ns.ts') },
        ],
        debugLog: msg => logs.push(msg.replace(dir, '<dir>')),
      }) as any],
    })
    const { output } = await bundle.generate({ format: 'esm' })
    await bundle.close()
    const mod = await import(`data:text/javascript,${encodeURIComponent(output[0].code)}`)
    return { result: mod.default, logs }
  }

  it('injects through Rolldown and runs the JS transform only where needed', async () => {
    const native = await build(true)
    expect(native.result).toEqual(['helper', 'hi', 1, 'helper', 'undefined'])
    expect(native.logs).toEqual(['[unimport] 1 imports detected in "<dir>/other.ts": helper'])
  })

  it('gives the same result as the JS transform', async () => {
    const js = await build(false)
    expect(js.result).toEqual(['helper', 'hi', 1, 'helper', 'undefined'])
    expect(js.logs).toHaveLength(2)
  })
})
