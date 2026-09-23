import type MagicString from 'magic-string'
import type { DetectImportResult, Import, InjectImportsOptions, UnimportContext } from './types'

import { detectSyntax, findStaticImports, parseStaticImport } from 'mlly'
import { RE_EXCLUDE, RE_IMPORT_AS, RE_MATCH, RE_SEPARATOR, stripCommentsAndStrings } from './regexp'
import { getMagicString } from './utils'

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
    // Collect identifiers already defined locally. For-of/for-in loop
    // declarations with a block body only shadow their own body, so those
    // are tracked as ranges instead of excluding the identifier outright —
    // this keeps outer references with the same name intact.
    const excluded = new Set<string>()
    const shadowRanges = new Map<string, [number, number][]>()
    for (const regex of RE_EXCLUDE) {
      for (const match of strippedCode.matchAll(regex)) {
        const segments = [...match[1]?.split(RE_SEPARATOR) || [], ...match[2]?.split(RE_SEPARATOR) || []]
        const range = getForLoopDeclarationRange(strippedCode, match)
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

function getForLoopDeclarationRange(code: string, match: RegExpMatchArray): [number, number] | undefined {
  if (!/\b(?:of|in)\s*$/.test(match[0]))
    return

  if (/\bvar\s+/.test(match[0]))
    return

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
