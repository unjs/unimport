import { table } from "table"
import { Import, MatchedGroupedImports, ReportMatchedOptions } from "./types"
import fs from "node:fs"
import path from "node:path"

export const printWrapper = (cb: Function) => {
  console.log()
  cb()
  console.log()
}

export const LABEL_STATIC = "(static)"
export const LABEL_DYNAMIC = "(dynamic)"

export const groupedImportsByFrom = (staticImports: Import[], dynamicImports: Import[]): MatchedGroupedImports => {
  const allImports = [...staticImports, ...dynamicImports]
    .toSorted((a, b) => a.from < b.from ? 1 : -1)
  let staticIdx = staticImports.length
  const groupedImports: Record<string, string[]> = {}

  // TODO: optimize with 2 pointers
  allImports.forEach((imp, idx) => {
    const prefixLabel = idx < staticIdx ? LABEL_STATIC : LABEL_DYNAMIC

    const { from, name, as } = imp

    const modName = name === as ? name : `${name}->${as}`
    const modFrom = `${prefixLabel} ${from}`

    if (!groupedImports[modFrom]) {
      groupedImports[modFrom] = []
    }

    groupedImports[modFrom].push(modName)
  })

  return Object.entries(groupedImports).map(([from, imports]) => {
    return [
      from,
      imports.join(", "),
    ]
  })
}

export const printFormatter = {
  table: (groupedImports: MatchedGroupedImports) => {
    const configs = {
      header: {
        content: "[unimport] Matched Imports",
      },
      columns: {
        0: {
          width: 50,
          wrapWord: true,
        },
        1: {
          width: 50,
          wrapWord: true,
        },
      }
    }

    return table(groupedImports, configs)
  },
  json: (groupedImports: MatchedGroupedImports) => {
    return JSON.stringify(groupedImports, null, 2)
  },
  compact: (groupedImports: MatchedGroupedImports) => {
    const result = groupedImports.map(([from, imports]) => {
      return `${from}: ${imports}`
    }).join("\n")

    return result
  }
}

export default function report(
  staticImports: Import[],
  dynamicImports: Import[],
  opts: ReportMatchedOptions = {}
) {
  // Quit if no output is needed
  if (!opts.printOut && !opts.outputToFile) {
    return
  }

  const {
    printOut = false,
    printFormat = "compact",
    outputFormat = "json",
    outputToFile = "",
    printFn = ({ formattedOutput }) =>
      console.log(formattedOutput),
  } = opts

  const imports = groupedImportsByFrom(staticImports, dynamicImports)

  if (printOut) {
    const formatter = printFormatter[printFormat] || printFormatter.compact

    const formattedOutput = formatter(imports)
    printWrapper(() => {
      printFn({ imports, formattedOutput })
    })
  }

  if (outputToFile) {
    const outputPath = path.resolve(process.cwd(), outputToFile)
    const formattedOutput = printFormatter[outputFormat] || printFormatter.compact

    fs.writeFile(outputPath, formattedOutput(imports), "utf-8", (err) => {
      if (err)
        throw new Error(`[unimport] Failed to write to file: ${err.message}`)

      printWrapper(() => {
        printFn({ imports, formattedOutput: `[unimport] Imports outputs written to ${outputPath}` })
      })
    })
  }
}
