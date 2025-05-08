import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi
} from 'vitest'
import fs from "node:fs";
import path from "node:path";
import report, {
  groupedImportsByFrom,
  printWrapper,
  printFormatter,
  LABEL_STATIC,
  LABEL_DYNAMIC
} from '../src/report'

describe('report', () => {

  describe("printwrapper", () => {
    it("should call the provided callback and print empty lines before and after", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { });
      const callbackSpy = vi.fn();

      printWrapper(callbackSpy);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // For the empty lines
      expect(callbackSpy).toHaveBeenCalledTimes(1); // For the callback execution

      vi.restoreAllMocks();
    });
  });

  describe("groupedImportsByFrom", () => {
    it("should group imports by 'from' with correct labels", () => {
      const staticImports = [
        { from: "moduleA", name: "A", as: "A" },
        { from: "moduleB", name: "B", as: "B" },
      ];
      const dynamicImports = [
        { from: "moduleC", name: "C", as: "C" },
      ];

      const result = groupedImportsByFrom(staticImports, dynamicImports);

      expect(result).toEqual([
        [`${LABEL_STATIC} moduleA`, "A"],
        [`${LABEL_STATIC} moduleB`, "B"],
        [`${LABEL_DYNAMIC} moduleC`, "C"],
      ]);
    });
  });

  describe("printFormatter", () => {
    const groupedImports = [
      [`${LABEL_STATIC} moduleA`, "A"],
      [`${LABEL_DYNAMIC} moduleB`, "B"],
    ];

    it("should format as table", () => {
      const result = printFormatter.table(groupedImports);
      expect(result).toContain("[unimport] Matched Imports");
    });

    it("should format as JSON", () => {
      const result = printFormatter.json(groupedImports);
      expect(result).toBe(JSON.stringify(groupedImports, null, 2));
    });

    it("should format as compact", () => {
      const result = printFormatter.compact(groupedImports);
      expect(result).toBe(`${LABEL_STATIC} moduleA: A\n${LABEL_DYNAMIC} moduleB: B`);
    });
  });

  describe("report", () => {
    const staticImports = [{ from: "moduleA", name: "A", as: "A" }];
    const dynamicImports = [{ from: "moduleB", name: "B", as: "B" }];

    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => { });
      // @ts-ignore
      vi.spyOn(fs, "writeFile").mockImplementation((_, __, ___, cb) => cb(null));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should print output when printOut is true", () => {
      report(staticImports, dynamicImports, { printOut: true });
      expect(console.log).toHaveBeenCalled();
    });

    it("should write output to file when outputToFile is specified", () => {
      const outputPath = "output.json";
      report(staticImports, dynamicImports, { outputToFile: outputPath });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(process.cwd(), outputPath),
        expect.any(String),
        "utf-8",
        expect.any(Function)
      );
    });
  });
})

