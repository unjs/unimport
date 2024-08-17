import type { StripLiteralOptions } from 'strip-literal'
import { stripLiteral } from 'strip-literal'

export const excludeRE = [
  // imported/exported from other module
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  /\b(import|export)\b\s*([\w$*{},\s]+?)\s*from\b/g,
  // defined as function
  /\bfunction\s*([\w$]+)\s*\(/g,
  // defined as class
  /\bclass\s*([\w$]+)\s*\{/g,
  // defined as local variable
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  /\b(?:const|let|var)\s+?(\[.*?\]|\{.*?\}|.+?)\s*?[=;\n]/gs,
]

export const importAsRE = /^.*\sas\s+/
export const separatorRE = /[,[\]{}\n]|\b(?:import|export)\b/g

/**
 *                                                                             |       |
 *                    destructing   case&ternary    non-call     inheritance   |  id   |
 *                         ↓             ↓             ↓             ↓         |       |
 */
// eslint-disable-next-line regexp/no-super-linear-backtracking
export const matchRE = /(^|\.\.\.|(?:\bcase|\?)\s+|[^\w$/)]|\bextends\s+)([\w$]+)\s*(?=[.()[\]}:;?+\-*&|`<>,\n]|\b(?:instanceof|in)\b|$|(?<=extends\s+\w+)\s+\{)/g

// eslint-disable-next-line regexp/no-super-linear-backtracking
const regexRE = /\/\S*?(?<!\\)(?<!\[[^\]]*)\/[gimsuy]*/g

export function stripCommentsAndStrings(code: string, options?: StripLiteralOptions) {
  return stripLiteral(code, options)
    .replace(regexRE, 'new RegExp("")')
}
