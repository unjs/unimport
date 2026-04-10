import type { StripLiteralOptions } from 'strip-literal'
import { stripLiteral } from 'strip-literal'

export const RE_EXCLUDE = [
  // imported/exported from other module
  /\b(import|export)\b([\w$*{},\s]+?)\bfrom\s*["']/g,
  // defined as function
  /\bfunction\s*([\w$]+)\s*\(/g,
  // defined as class
  /\bclass\s*([\w$]+)\s*\{/g,
  // defined as local variable (including for-of/for-in loop declarations)
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  /\b(?:const|let|var)\s+?(\[.*?\]|\{.*?\}|.+?)\s*?(?:[=;\n]|\bof\b|\bin\b)/gs,
]

export const RE_IMPORT_AS = /^.*\sas\s+/
export const RE_SEPARATOR = /[,[\]{}\n]|\b(?:import|export)\b/g

/**
 *                                                                             |       |
 *                    destructing   case&ternary    non-call     inheritance   |  id   |
 *                         ↓             ↓             ↓             ↓         |       |
 */
// eslint-disable-next-line regexp/no-super-linear-backtracking
export const RE_MATCH = /(^|\.\.\.|(?:\bcase|\?)\s+|[^\w$/)]|\bextends\s+)([\w$]+)\s*(?=[.()[\]}:;?+\-*&|`<>,\n]|\b(?:instanceof|in)\b|$|(?<=extends\s+\w+)\s+\{)/g

// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_REGEX = /\/\S*?(?<!\\)(?<!\[[^\]]*)\/[gimsuy]*/g

export function stripCommentsAndStrings(code: string, options?: StripLiteralOptions) {
  return stripLiteral(code, options)
    .replace(RE_REGEX, 'new RegExp("")')
}

/**
 * @deprecated renamed to `RE_EXCLUDE`
 */
export const excludeRE = RE_EXCLUDE

/**
 * @deprecated renamed to `RE_IMPORT_AS`
 */
export const importAsRE = RE_IMPORT_AS

/**
 * @deprecated renamed to `RE_SEPARATOR`
 */
export const separatorRE = RE_SEPARATOR

/**
 * @deprecated renamed to `RE_MATCH`
 */
export const matchRE = RE_MATCH
