import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createUnimport } from '../src'
import * as reportModule from "../src/report"
import { Import, OptionsReportMatched } from "../src/types"

describe('context', () => {
  it('should not re-export types', async () => {
    const unimport = createUnimport({
      imports: [
        { name: 'default', from: 'jquery', as: '$' },
        { name: 'foo', from: 'foo', as: 'disabled', disabled: true },
        { name: 'FOO', from: 'vue', type: true },
      ],
      presets: [
        {
          from: 'vue',
          imports: ['ref', 'reactive', 'computed', { name: 'Ref', type: true }],
        },
      ],
    })

    expect(await unimport.toExports()).toMatchInlineSnapshot(`
      "export { ref, reactive, computed } from 'vue';
      export { default as $ } from 'jquery';"
    `)
  })

  describe("reportMatched", () => {
    let unimport: ReturnType<typeof createUnimport>
    let reportSpy: ReturnType<typeof vi.spyOn>
    const staticImports: Import[] = [
      { name: "ref", as: "ref", from: "vue" },
      { name: "reactive", as: "reactive", from: "vue" },
      { name: "map", as: "map", from: "lodash" },
    ]

    beforeEach(() => {
      reportSpy = vi.spyOn(reportModule, "default").mockImplementation(() => "reported" as any)
      unimport = createUnimport({ imports: staticImports })
    })

    afterEach(() => {
      reportSpy.mockRestore()
    })

    it("should call report with correct arguments", async () => {
      const options: OptionsReportMatched = { printOut: true }
      const result = await unimport.reportMatched(options)
      expect(reportSpy).toHaveBeenCalled()
      expect(result).toBe("reported")
    })

    it("should pass the import map to report", async () => {
      await unimport.getImports()
      const options: OptionsReportMatched = { printOut: true }
      await unimport.reportMatched(options)
      const importMap = await unimport.getImportMap()
      expect(reportSpy).toHaveBeenCalledWith(importMap, options)
    })

    it("should work with empty imports", async () => {
      unimport = createUnimport({ imports: [] })
      const options: OptionsReportMatched = { printOut: true }
      await unimport.reportMatched(options)
      const importMap = await unimport.getImportMap()
      expect(Array.from(importMap.values())).toEqual([])
      expect(reportSpy).toHaveBeenCalledWith(importMap, options)
    })

    it("should handle undefined options", async () => {
      await unimport.reportMatched(undefined as any)
      expect(reportSpy).toHaveBeenCalled()
    })
  })
})

