import type { StripLiteralOptions } from 'strip-literal'
import { stripLiteral } from 'strip-literal'

export const excludeRE = [
  // imported/exported from other module
  /\b(import|export)\b([\s\w_$*{},]+)\sfrom\b/gs,
  // defined as function
  /\bfunction\s*([\w_$]+?)\s*\(/gs,
  // defined as class
  /\bclass\s*([\w_$]+?)\s*{/gs,
  // defined as local variable
  /\b(?:const|let|var)\s+?(\[.*?\]|\{.*?\}|.+?)\s*?[=;\n]/gs,
]

export const importAsRE = /^.*\sas\s+/
export const separatorRE = /[,[\]{}\n]|\bimport\b/g

/**
 *                                                                             |       |
 *                    destructing   case&ternary    non-call     inheritance   |  id   |
 *                         ↓             ↓             ↓             ↓         |       |
 */
export const matchRE = /(^|\.\.\.|(?:\bcase|\?)\s+|[^\w_$\/)]|(?:\bextends)\s+)([\w_$]+)\s*(?=[.()[\]}}:;?+\-*&|`<>,\n]|\b(?:instanceof|in)\b|$|(?<=extends\s+\w+)\s+{)/g

const regexRE = /\/[^\s]*?(?<!\\)(?<!\[[^\]]*)\/[gimsuy]*/g

export function stripCommentsAndStrings(code: string, options?: StripLiteralOptions) {
  return stripLiteral(code, options)
    .replace(regexRE, 'new RegExp("")')
}
