import type MagicString from 'magic-string'
import type { DetectImportResult, Import, InjectImportsOptions, UnimportContext } from './types'

import { detectSyntax, findStaticImports, parseStaticImport } from 'mlly'
import { RE_EXCLUDE, RE_IMPORT_AS, RE_MATCH, RE_SEPARATOR, stripCommentsAndStrings } from './regexp'
import { getMagicString } from './utils'

/**
 * Index of the `import`/`export` rule in `RE_EXCLUDE`. It is the only rule
 * whose matches are guaranteed to be module-scoped, so its identifiers are
 * excluded globally instead of being tracked as shadow ranges.
 */
const GLOBAL_EXCLUDE_RULE_INDEX = 0

export async function detectImportsRegex(
  code: string | MagicString,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
): Promise<DetectImportResult> {
  const s = getMagicString(code)
  // Strip comments so we don't match on them
  const original = s.original
  const strippedCode = stripCommentsAndStrings(
    original,
    // Do not strip comments if they are virtual import names
    options?.transformVirtualImports !== false && ctx.options.virtualImports?.length
      ? {
          filter: i => !(ctx.options.virtualImports!.includes(i)),
          fillChar: '-',
        }
      : undefined,
  )
  const syntax = detectSyntax(strippedCode)
  const isCJSContext = syntax.hasCJS && !syntax.hasESM
  let matchedImports: Import[] = []

  const occurrenceMap = new Map<string, number>()

  const map = await ctx.getImportMap()
  // Auto import, search for unreferenced usages
  if (options?.autoImport !== false) {
    // Collect identifiers already defined locally. Declarations nested in a
    // block (function body, loop body, plain block, ...) only shadow the
    // references inside that block, so those are tracked as ranges instead of
    // excluding the identifier outright — this keeps outer references with
    // the same name intact.
    const excluded = new Set<string>()
    const shadowRanges = new Map<string, [number, number][]>()
    for (const [ruleIndex, regex] of RE_EXCLUDE.entries()) {
      for (const match of strippedCode.matchAll(regex)) {
        const segments = [...match[1]?.split(RE_SEPARATOR) || [], ...match[2]?.split(RE_SEPARATOR) || []]
        // `import`/`export` can only appear at the module top level, so those
        // are always excluded globally. Every other declaration may live in a
        // nested block and therefore needs a shadow range.
        const range = ruleIndex === GLOBAL_EXCLUDE_RULE_INDEX
          ? undefined
          : getDeclarationScopeRange(strippedCode, match)
        for (const segment of segments) {
          const identifier = segment.replace(RE_IMPORT_AS, '').trim()
          if (!identifier)
            continue
          if (!range) {
            excluded.add(identifier)
            continue
          }
          const ranges = shadowRanges.get(identifier)
          if (ranges)
            ranges.push(range)
          else
            shadowRanges.set(identifier, [range])
        }
      }
    }

    // Find all possible injection
    for (const i of strippedCode.matchAll(RE_MATCH)) {
      // Remove dot access, but keep destructuring
      if (i[1] === '.')
        continue

      // Remove property, but keep `case x:` and `? x :`
      const end = strippedCode[i.index! + i[0].length]
      // also keeps deep ternary like `true ? false ? a : b : c`
      const before = strippedCode[i.index! - 1]
      if (end === ':' && !['?', 'case'].includes(i[1].trim()) && before !== ':')
        continue

      const name = i[2]
      if (excluded.has(name))
        continue

      const occurrence = i.index! + i[1].length
      const ranges = shadowRanges.get(name)
      if (ranges?.some(([start, rangeEnd]) => occurrence >= start && occurrence <= rangeEnd))
        continue

      const prev = occurrenceMap.get(name)
      if (prev === undefined || occurrence < prev)
        occurrenceMap.set(name, occurrence)
    }

    const identifiers = new Set(occurrenceMap.keys())
    matchedImports = Array.from(identifiers)
      .map((name) => {
        const item = map.get(name)
        if (item && !item.disabled)
          return item

        occurrenceMap.delete(name)
        return null
      })
      .filter(Boolean) as Import[]

    for (const addon of ctx.addons)
      matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports
  }

  // Transform virtual imports like `import { foo } from '#imports'`
  if (options?.transformVirtualImports !== false && ctx.options.virtualImports?.length) {
    const virtualImports = parseVirtualImportsRegex(strippedCode, map, ctx.options.virtualImports)

    virtualImports.ranges.forEach(([start, end]) => {
      s.remove(start, end)
    })

    matchedImports.push(...virtualImports.imports)
  }

  const firstOccurrence = Math.min(...occurrenceMap.values())

  return {
    s,
    strippedCode,
    isCJSContext,
    matchedImports,
    firstOccurrence,
  }
}

/**
 * Find the innermost block (`{ ... }`) enclosing `position`.
 *
 * Returns `undefined` when the declaration sits at the module top level, which
 * means it really does shadow the whole module. Otherwise the returned range
 * covers the enclosing block, so only references inside it are skipped.
 */
function getEnclosingBlockRange(code: string, position: number): [number, number] | undefined {
  let depth = 0
  for (let i = position - 1; i >= 0; i--) {
    const char = code[i]
    if (char === '}') {
      depth++
    }
    else if (char === '{') {
      if (depth === 0) {
        const end = findMatchingCharacter(code, i, '{', '}')
        return end === -1 ? undefined : [i, end]
      }
      depth--
    }
  }
  return undefined
}

/**
 * Determine the scope a declaration shadows.
 *
 * `var` is function-scoped (or module-scoped when not nested in a function),
 * while `let`/`const` are block-scoped. Returning `undefined` means the
 * declaration shadows the whole module and the identifier is excluded
 * globally.
 */
function getDeclarationScopeRange(code: string, match: RegExpMatchArray): [number, number] | undefined {
  if (/\bvar\s+/.test(match[0]))
    return getFunctionScopeRange(code, match.index!)

  return getForLoopDeclarationRange(code, match) ?? getEnclosingBlockRange(code, match.index!)
}

/**
 * Find the innermost enclosing function body (`{ ... }`) of `position`.
 *
 * Returns `undefined` when there is none, meaning the declaration is at the
 * module top level and therefore shadows the entire module.
 */
function getFunctionScopeRange(code: string, position: number): [number, number] | undefined {
  let depth = 0
  for (let i = position - 1; i >= 0; i--) {
    const char = code[i]
    if (char === '}') {
      depth++
    }
    else if (char === '{') {
      if (depth === 0) {
        const end = findMatchingCharacter(code, i, '{', '}')
        if (end === -1)
          return undefined
        if (isFunctionBody(code, i))
          return [i, end]
        // Not a function body (e.g. `if (x) { ... }`) — keep walking outwards.
      }
      else {
        depth--
      }
    }
  }
  return undefined
}

/**
 * Whether the block starting at `braceIndex` is a function body rather than a
 * control-flow block such as `if (...) {`, `for (...) {` or `catch (...) {`.
 */
function isFunctionBody(code: string, braceIndex: number): boolean {
  let i = braceIndex - 1
  while (i >= 0 && /\s/.test(code[i]))
    i--
  if (i < 0)
    return false

  // Arrow function: `=> {`
  if (code[i] === '>' && code[i - 1] === '=')
    return true

  if (code[i] !== ')')
    return false

  const open = findMatchingCharacterBackwards(code, i, '(', ')')
  if (open === -1)
    return false

  let j = open - 1
  while (j >= 0 && /\s/.test(code[j]))
    j--
  if (j < 0)
    return false

  // `if (` / `for (` / `while (` / `switch (` / `catch (` are not functions.
  const keyword = /([\w$]+)\s*$/.exec(code.slice(0, j + 1))
  if (keyword && ['if', 'for', 'while', 'switch', 'catch', 'with'].includes(keyword[1]))
    return false

  return true
}

function findMatchingCharacterBackwards(code: string, start: number, open: string, close: string) {
  let depth = 0
  for (let i = start; i >= 0; i--) {
    if (code[i] === close) {
      depth++
    }
    else if (code[i] === open) {
      depth--
      if (depth === 0)
        return i
    }
  }
  return -1
}

/**
 * Range covered by a loop declaration and its body.
 *
 * Handles `for...of` / `for...in` as well as C-style `for (let i = 0; ...)`, and
 * unbraced bodies (a single statement).
 */
function getForLoopDeclarationRange(code: string, match: RegExpMatchArray): [number, number] | undefined {
  const declarationStart = match.index!
  const beforeDeclaration = code.slice(0, declarationStart)
  const forHeader = /\bfor\s*(?:await\s*)?\([^()]*$/.exec(beforeDeclaration)
  if (!forHeader)
    return

  const headerStart = forHeader.index
  const headerOpen = beforeDeclaration.indexOf('(', headerStart)
  if (headerOpen === -1)
    return

  const headerEnd = findMatchingCharacter(code, headerOpen, '(', ')')
  if (headerEnd === -1)
    return

  let bodyStart = headerEnd + 1
  while (/\s/.test(code[bodyStart] || ''))
    bodyStart++

  if (code[bodyStart] === '{') {
    const bodyEnd = findMatchingCharacter(code, bodyStart, '{', '}')
    if (bodyEnd !== -1)
      return [declarationStart, bodyEnd]
  }
  else {
    // Unbraced body: a single statement, ended by `;`, a newline, or the
    // closing bracket of an enclosing construct.
    let depth = 0
    for (let i = bodyStart; i < code.length; i++) {
      const char = code[i]
      if (char === '(' || char === '[' || char === '{') {
        depth++
      }
      else if (char === ')' || char === ']' || char === '}') {
        if (depth === 0)
          return [declarationStart, i - 1]
        depth--
      }
      else if (depth === 0 && (char === ';' || char === '\n')) {
        return [declarationStart, i]
      }
    }
    return [declarationStart, code.length - 1]
  }
}

function findMatchingCharacter(code: string, start: number, open: string, close: string) {
  let depth = 0
  for (let i = start; i < code.length; i++) {
    if (code[i] === open) {
      depth++
    }
    else if (code[i] === close) {
      depth--
      if (depth === 0)
        return i
    }
  }
  return -1
}

export function parseVirtualImportsRegex(
  strippedCode: string,
  importMap: Map<string, Import>,
  virtualImports?: string[],
) {
  const imports: Import[] = []
  const ranges: [number, number][] = []

  if (virtualImports?.length) {
    findStaticImports(strippedCode)
      .filter(i => virtualImports!.includes(i.specifier))
      .map(i => parseStaticImport(i))
      .forEach((i) => {
        ranges.push([i.start, i.end])
        Object.entries(i.namedImports || {})
          .forEach(([name, as]) => {
            const original = importMap.get(name)
            if (!original)
              throw new Error(`[unimport] failed to find "${name}" imported from "${i.specifier}"`)

            imports.push({
              from: original.from,
              name: original.name,
              as,
            })
          })
      })
  }

  return {
    imports,
    ranges,
  }
}
