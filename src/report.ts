import fs from "node:fs"
import path from "node:path"

import { table } from "table"
import MagicString from "magic-string"

import { Import, MatchedGroupedImports, OptionsReportMatched } from "./types"

/**
 * Prints a message before and after executing the provided callback function.
 *
 * @param {Function} cb - The callback function to customize the print output.
 */
export const printWrapper = (cb: Function) => {
  console.log()
  cb()
  console.log()
}

/**
 * Group imports by their 'from' property.
 * Format of the output:
 * [<from>, [<import1>, <import2>, ...]]
 *
 *  e.g. ['vue', ['useId', 'useTemplateRef', ...]]
 *
 * @param {Map<string, Import>} matchedImports - A map of matched imports.
 * @returns {Array<[string, string[]]>} - An array of tuples where each tuple contains the 'from' property and an array of import names.
 */
export const groupedImportsByFrom = (matchedImports: Map<string, Import>): MatchedGroupedImports => {
  const groupedMap = new Map<string, string[]>()

  matchedImports.forEach(({ from, name, as }) => {
    if (!groupedMap.has(from)) {
      groupedMap.set(from, [])
    }

    const modName = name === as ? name : `${name}->${as}`

    groupedMap.get(from)?.push(modName)
  });

  return Array.from(groupedMap.entries())
}

const _DEFAULT_TABLE_CONFIGS = {
  header: {
    content: "<PLACEHOLDER_TITLE>",
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

/**
 * Formatter for printing matched imports in different formats.
 */
export const printFormatter = {
  table: (groupedImports: MatchedGroupedImports) => {
    if (groupedImports.length === 0) {
      return `[unimport] matched imports (0):\n`
    }

    return new MagicString(
      table(groupedImports, _DEFAULT_TABLE_CONFIGS)
    ).replace(
      "<PLACEHOLDER_TITLE>",
      `[unimport] matched imports (${groupedImports.length}):\n`
    ).toString()
  },
  json: (groupedImports: MatchedGroupedImports) => {
    return new MagicString(
      JSON.stringify(groupedImports, null, 2)
    ).prepend(
      `[unimport] matched imports (${groupedImports.length}):\n`
    ).toString()
  },
  compact: (groupedImports: MatchedGroupedImports) => {
    return new MagicString(
      groupedImports.map(([from, imports]) =>
        `${from}: ${imports}`
      ).join("\n")
    ).prepend(
      `[unimport] matched imports (${groupedImports.length}):\n`
    ).toString()
  }
}

/**
 * Report function to handle matched imports.
 * It can print the output to the console or write it to a file.
 *
 * @param {Map<string, Import>} matchedImports - A map of matched imports.
 * @param {OptionsReportMatched} opts - Options for reporting.
 */
export default function report(
  matchedImports: Map<string, Import>,
  opts: OptionsReportMatched = {}
) {
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

  const imports = groupedImportsByFrom(matchedImports)

  if (printOut) {
    const formatter = printFormatter[printFormat] || printFormatter.compact
    const formattedOutput = formatter(imports)

    printWrapper(() => {
      printFn({ imports, formattedOutput })
    })
  }

  if (outputToFile) {
    const formatter = printFormatter[outputFormat] || printFormatter.compact
    const formattedOutput = formatter(imports)
    const outputPath = path.resolve(process.cwd(), outputToFile)

    fs.writeFile(outputPath, formattedOutput, "utf-8", (err) => {
      if (err)
        throw new Error(`[unimport] Failed to write to file: ${err.message}`)

      printWrapper(() => {
        printFn({ imports, formattedOutput: `[unimport] Imports outputs are written to ${outputPath}\n` })
      })
    })
  }
}
