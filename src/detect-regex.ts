import { detectSyntax, findStaticImports, parseStaticImport } from 'mlly'
import type MagicString from 'magic-string'
import type { DetectImportResult, Import, InjectImportsOptions, UnimportContext } from './types'
import { getMagicString } from './utils'
import { excludeRE, importAsRE, matchRE, separatorRE, stripCommentsAndStrings } from './regexp'

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
    // Find all possible injection
    Array.from(strippedCode.matchAll(matchRE))
      .forEach((i) => {
        // Remove dot access, but keep destructuring
        if (i[1] === '.')
          return null

        // Remove property, but keep `case x:` and `? x :`
        const end = strippedCode[i.index! + i[0].length]
        // also keeps deep ternary like `true ? false ? a : b : c`
        const before = strippedCode[i.index! - 1]
        if (end === ':' && !['?', 'case'].includes(i[1].trim()) && before !== ':')
          return null

        const name = i[2]
        const occurrence = i.index! + i[1].length
        if (occurrenceMap.get(name) || Number.POSITIVE_INFINITY > occurrence)
          occurrenceMap.set(name, occurrence)
      })

    // Remove those already defined
    for (const regex of excludeRE) {
      for (const match of strippedCode.matchAll(regex)) {
        const segments = [...match[1]?.split(separatorRE) || [], ...match[2]?.split(separatorRE) || []]
        for (const segment of segments) {
          const identifier = segment.replace(importAsRE, '').trim()
          occurrenceMap.delete(identifier)
        }
      }
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

  const firstOccurrence = Math.min(...Array.from(occurrenceMap.entries()).map(i => i[1]))

  return {
    s,
    strippedCode,
    isCJSContext,
    matchedImports,
    firstOccurrence,
  }
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
