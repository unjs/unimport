import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi
} from 'vitest'
import fs from "node:fs"
import * as reportModule from "../src/report"
import { Import, MatchedGroupedImports } from "../src/types"

describe('report', () => {

  describe("printwrapper", () => {
    it("should print before and after the callback", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => { })
      const cb = vi.fn()
      reportModule.printWrapper(cb)
      expect(logSpy).toHaveBeenCalledTimes(2)
      expect(cb).toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it("should call the provided callback and print empty lines before and after", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { })
      const callbackSpy = vi.fn()

      reportModule.printWrapper(callbackSpy)

      expect(consoleLogSpy).toHaveBeenCalledTimes(2) // For the empty lines
      expect(callbackSpy).toHaveBeenCalledTimes(1) // For the callback execution

      vi.restoreAllMocks()
    })
  })

  describe("groupedImportsByFrom", () => {

    it("should group imports by 'from'", () => {
      const imports = new Map<string, Import>([
        ["1", { from: "vue", name: "ref", as: "ref" }],
        ["2", { from: "vue", name: "reactive", as: "reactive" }],
        ["3", { from: "lodash", name: "map", as: "map" }],
        ["4", { from: "vue", name: "computed", as: "c" }],
      ])
      const grouped = reportModule.groupedImportsByFrom(imports)
      expect(grouped).toEqual([
        ["vue", ["ref", "reactive", "computed->c"]],
        ["lodash", ["map"]],
      ])
    })
  })

  describe("printFormatter", () => {
    const groupedImports = [
      ["vue", ["ref", "reactive"]],
      ["lodash", ["map"]],
    ] as [string, string[]][]

    it("should format as table", () => {
      const output = reportModule.printFormatter.table(groupedImports)
      expect(output).toContain("[unimport] matched imports (2):")
      expect(output).toContain("vue")
      expect(output).toContain("lodash")
    })

    it("should format as json", () => {
      const output = reportModule.printFormatter.json(groupedImports)
      expect(output).toContain("[unimport] matched imports (2):")
      expect(output).toContain('"vue"')
      expect(output).toContain('"lodash"')

      expect(output.replace("[unimport] matched imports (2):\n", ""))
        .toBe(JSON.stringify(groupedImports, null, 2))
    })

    it("should format as compact", () => {
      const output = reportModule.printFormatter.compact(groupedImports)
      expect(output).toContain("[unimport] matched imports (2):")
      expect(output.replace("[unimport] matched imports (2):\n", ""))
        .toBe("vue: ref,reactive\nlodash: map")
    })
  })

  describe("report", () => {
    let writeFileSpy: ReturnType<typeof vi.spyOn>
    let logSpy: ReturnType<typeof vi.spyOn>
    const imports = new Map<string, Import>([
      ["1", { from: "vue", name: "ref", as: "ref" }],
      ["2", { from: "lodash", name: "map", as: "map" }],
    ])

    beforeEach(() => {
      // @ts-ignore
      writeFileSpy = vi.spyOn(fs, "writeFile").mockImplementation((_, __, ___, cb) => cb && cb(null))
      logSpy = vi.spyOn(console, "log").mockImplementation(() => { })
    })

    afterEach(() => {
      writeFileSpy.mockRestore()
      logSpy.mockRestore()
    })

    it("should print output when printOut is true", () => {
      const printFn = vi.fn()
      reportModule.default(imports, { printOut: true, printFn })
      expect(printFn).toHaveBeenCalled()
    })

    it("should write output to file when outputToFile is set", () => {
      const printFn = vi.fn()
      reportModule.default(imports, { outputToFile: "test.txt", printFn })
      expect(writeFileSpy).toHaveBeenCalled()
      expect(printFn).toHaveBeenCalled()
    })

    it("should do nothing if neither printOut nor outputToFile is set", () => {
      reportModule.default(imports, {})
      expect(logSpy).not.toHaveBeenCalled()
      expect(writeFileSpy).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("groupedImportsByFrom returns empty array for empty input", () => {
      const grouped = reportModule.groupedImportsByFrom(new Map())
      expect(grouped).toEqual([])
    })

    it("printFormatter.table handles empty groupedImports", () => {
      const output = reportModule.printFormatter.table([])
      expect(output).toContain("[unimport] matched imports (0):")
    })

    it("printFormatter.json handles empty groupedImports", () => {
      const output = reportModule.printFormatter.json([])
      expect(output).toContain("[unimport] matched imports (0):")
      expect(output).toContain("[]")
    })

    it("printFormatter.compact handles empty groupedImports", () => {
      const output = reportModule.printFormatter.compact([])
      expect(output).toContain("[unimport] matched imports (0):")
    })

    it("printFormatter.table handles long import names", () => {
      const groupedImports = [
        ["verylongmodulename", ["averylongimportnameaverylongimportnameaverylongimportname"]]
      ] as const satisfies MatchedGroupedImports
      const output = reportModule.printFormatter.table(groupedImports)
      expect(output).toContain("verylongmodulename")
    })

    it("report uses fallback formatter for unknown printFormat/outputFormat", () => {
      const imports = new Map<string, Import>([
        ["1", { from: "vue", name: "ref", as: "ref" }]
      ])
      const printFn = vi.fn()
      reportModule.default(imports, { printOut: true, printFormat: "unknown" as any, printFn })
      expect(printFn).toHaveBeenCalled()

      // @ts-ignore
      const writeFileSpy = vi.spyOn(fs, "writeFile").mockImplementation((_, __, ___, cb) => cb && cb(null))
      reportModule.default(imports, { outputToFile: "test.txt", outputFormat: "unknown" as any, printFn })
      expect(writeFileSpy).toHaveBeenCalled()
      writeFileSpy.mockRestore()
    })

    it("report throws error if fs.writeFile fails", () => {
      const imports = new Map<string, Import>([
        ["1", { from: "vue", name: "ref", as: "ref" }]
      ])
      // @ts-ignore
      const writeFileSpy = vi.spyOn(fs, "writeFile").mockImplementation((_, __, ___, cb) => cb && cb(new Error("fail")))
      expect(() =>
        reportModule.default(imports, { outputToFile: "fail.txt" })
      ).toThrow("[unimport] Failed to write to file: fail")
      writeFileSpy.mockRestore()
    })

    it("report passes correct arguments to printFn", () => {
      const imports = new Map<string, Import>([
        ["1", { from: "vue", name: "ref", as: "ref" }]
      ])
      const printFn = vi.fn()
      reportModule.default(imports, { printOut: true, printFn })
      expect(printFn).toHaveBeenCalledWith(
        expect.objectContaining({
          imports: expect.any(Array),
          formattedOutput: expect.any(String)
        })
      )
    })
  })
})

