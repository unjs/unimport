import type MagicString from 'magic-string'
import type { Node, Program } from 'oxc-parser'
import type { Import, InjectImportsOptions, UnimportContext } from './types'
import { isReferenceIdentifier, ScopeTracker, walk } from 'oxc-walker'
import { getMagicString } from './utils'

export function createEstreeDetector(parse: (code: string) => Program) {
  return async (
    code: string | MagicString,
    ctx: UnimportContext,
    options?: InjectImportsOptions,
  ) => {
    const s = getMagicString(code)
    const map = await ctx.getImportMap()

    let matchedImports: Import[] = []

    const enableAutoImport = options?.autoImport !== false
    const enableTransformVirtualImports = options?.transformVirtualImports !== false && ctx.options.virtualImports?.length

    if (enableAutoImport || enableTransformVirtualImports) {
      const ast = parse(s.original)

      const virtualImports = createVirtualImports(map, ctx.options.virtualImports)

      const identifiers = findUnmatchedIdentifiers(
        ast,
        enableTransformVirtualImports ? virtualImports.enter : undefined,
      )

      if (enableAutoImport) {
        matchedImports.push(
          ...Array.from(identifiers)
            .map((name) => {
              const item = map.get(name)
              if (item && !item.disabled)
                return item
              return null
            })
            .filter(Boolean) as Import[],
        )

        for (const addon of ctx.addons)
          matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports
      }

      virtualImports.ranges.forEach(([start, end]) => {
        s.remove(start, end)
      })
      matchedImports.push(...virtualImports.imports)
    }

    return {
      s,
      strippedCode: code.toString(),
      matchedImports,
      isCJSContext: false,
      firstOccurrence: 0, // TODO:
    }
  }
}

export function findUnmatchedIdentifiers(program: Program, additionalEnter?: (node: Node) => void) {
  const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })

  // first pass to collect all declarations and hoist them
  walk(program, { scopeTracker })
  scopeTracker.freeze()

  const unmatched = new Set<string>()

  walk(program, {
    scopeTracker,
    enter(node, parent) {
      additionalEnter?.(node as unknown as Node)

      // re-export specifiers refer to the other module's exports
      if (node.type === 'ExportNamedDeclaration' && node.source) {
        this.skip()
        return
      }

      if (
        (node.type === 'Identifier' || node.type === 'JSXIdentifier')
        && isReferenceIdentifier(node, parent)
        && !scopeTracker.isDeclared(node.name)
      ) {
        unmatched.add(node.name)
      }
    },
  })

  return unmatched
}

function createVirtualImports(
  importMap: Map<string, Import>,
  virtualImports: string[] = [],
): {
  imports: Import[]
  ranges: [number, number][]
  enter: (node: Node) => void
} {
  const imports: Import[] = []
  const ranges: [number, number][] = []

  return {
    imports,
    ranges,
    enter(node) {
      if (node.type !== 'ImportDeclaration' || !virtualImports.includes(node.source.value))
        return

      ranges.push([node.start, node.end])
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier')
          continue

        const original = importMap.get(specifier.imported.name)
        if (!original)
          throw new Error(`[unimport] failed to find "${specifier.imported.name}" imported from "${node.source.value}"`)
        imports.push({
          from: original.from,
          name: original.name,
          as: specifier.local.name,
        })
      }
    },
  }
}
