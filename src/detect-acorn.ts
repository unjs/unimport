import type MagicString from 'magic-string'
import type { BlockStatement, Node } from 'estree'
import { parse } from 'acorn'
import { walk } from 'estree-walker'
import type { ArgumentsType } from 'vitest'
import type { DetectImportResult, Import, InjectImportsOptions, UnimportContext } from './types'
import { getMagicString } from './utils'

export async function detectImportsAcorn(
  code: string | MagicString,
  ctx: UnimportContext,
  options?: InjectImportsOptions,
): Promise<DetectImportResult> {
  const s = getMagicString(code)
  const map = await ctx.getImportMap()

  let matchedImports: Import[] = []

  const enableAutoImport = options?.autoImport !== false
  const enableTransformVirtualImports = options?.transformVirtualImports !== false && ctx.options.virtualImports?.length

  if (enableAutoImport || enableTransformVirtualImports) {
    const ast = parse(s.original, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      locations: true,
    })

    const occurrenceMap = new Map<string, number>()

    const virtualImports = createVirtualImportsAcronWalker(map, ctx.options.virtualImports)

    const scopes = traveseScopes(
      ast as Node,
      (enableTransformVirtualImports)
        ? virtualImports.walk
        : {},
    )

    if (enableAutoImport) {
      const identifiers = new Set(occurrenceMap.keys())
      matchedImports.push(
        ...Array.from(scopes.unmatched)
          .map((name) => {
            const item = map.get(name)
            if (item && !item.disabled)
              return item

            occurrenceMap.delete(name)
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

export interface Scope {
  node?: BlockStatement
  parent?: Scope
  declarations: Set<string>
  references: Set<string>
}

export function traveseScopes(ast: Node, additionalWalk?: ArgumentsType<typeof walk>[1]) {
  const scopes: Scope[] = []
  let scopeCurrent: Scope = undefined!
  const scopesStack: Scope[] = []

  function pushScope(node: BlockStatement) {
    scopeCurrent = {
      node,
      parent: scopeCurrent,
      declarations: new Set(),
      references: new Set(),
    }
    scopes.push(scopeCurrent)
    scopesStack.push(scopeCurrent)
  }

  function popScope(node: BlockStatement) {
    const scope = scopesStack.pop()
    if (scope?.node !== node)
      throw new Error('Scope mismatch')
    scopeCurrent = scopesStack[scopesStack.length - 1]
  }

  pushScope(undefined!)

  walk(ast, {
    enter(node, parent, prop, index) {
      additionalWalk?.enter?.call(this, node, parent, prop, index)
      switch (node.type) {
        // ====== Declaration ======
        case 'ImportSpecifier':
        case 'ImportDefaultSpecifier':
        case 'ImportNamespaceSpecifier':
          scopeCurrent.declarations.add(node.local.name)
          return
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
          if (node.id)
            scopeCurrent.declarations.add(node.id.name)
          return
        case 'VariableDeclarator':
          if (node.id.type === 'Identifier') {
            scopeCurrent.declarations.add(node.id.name)
          }
          else {
            walk(node.id, {
              enter(node) {
                if (node.type === 'ObjectPattern') {
                  node.properties.forEach((i) => {
                    if (i.type === 'Property' && i.value.type === 'Identifier')
                      scopeCurrent.declarations.add(i.value.name)
                    else if (i.type === 'RestElement' && i.argument.type === 'Identifier')
                      scopeCurrent.declarations.add(i.argument.name)
                  })
                }
                else if (node.type === 'ArrayPattern') {
                  node.elements.forEach((i) => {
                    if (i?.type === 'Identifier')
                      scopeCurrent.declarations.add(i.name)
                    if (i?.type === 'RestElement' && i.argument.type === 'Identifier')
                      scopeCurrent.declarations.add(i.argument.name)
                  })
                }
              },
            })
          }
          return

        // ====== Scope ======
        case 'BlockStatement':
          pushScope(node)
          return

        // ====== Reference ======
        case 'Identifier':
          switch (parent?.type) {
            case 'CallExpression':
              if (parent.callee === node || parent.arguments.includes(node))
                scopeCurrent.references.add(node.name)
              return
            case 'MemberExpression':
              if (parent.object === node)
                scopeCurrent.references.add(node.name)
              return
            case 'VariableDeclarator':
              if (parent.init === node)
                scopeCurrent.references.add(node.name)
              return
            case 'SpreadElement':
              if (parent.argument === node)
                scopeCurrent.references.add(node.name)
              return
            case 'ClassDeclaration':
              if (parent.superClass === node)
                scopeCurrent.references.add(node.name)
              return
            case 'Property':
              if (parent.value === node)
                scopeCurrent.references.add(node.name)
              return
            case 'TemplateLiteral':
              if (parent.expressions.includes(node))
                scopeCurrent.references.add(node.name)
              return
            case 'AssignmentExpression':
              if (parent.right === node)
                scopeCurrent.references.add(node.name)
              return
            case 'IfStatement':
            case 'WhileStatement':
            case 'DoWhileStatement':
              if (parent.test === node)
                scopeCurrent.references.add(node.name)
              return
            case 'SwitchStatement':
              if (parent.discriminant === node)
                scopeCurrent.references.add(node.name)
              return
          }
          if (parent?.type.includes('Expression'))
            scopeCurrent.references.add(node.name)
      }
    },
    leave(node, parent, prop, index) {
      additionalWalk?.leave?.call(this, node, parent, prop, index)
      switch (node.type) {
        case 'BlockStatement':
          popScope(node)
      }
    },
  })

  const unmatched = new Set<string>()
  for (const scope of scopes) {
    for (const name of scope.references) {
      let defined = false
      let parent: Scope | undefined = scope
      while (parent) {
        if (parent.declarations.has(name)) {
          defined = true
          break
        }
        parent = parent?.parent
      }
      if (!defined)
        unmatched.add(name)
    }
  }

  return {
    unmatched,
    scopes,
  }
}

export function createVirtualImportsAcronWalker(
  importMap: Map<string, Import>,
  virtualImports: string[] = [],
) {
  const imports: Import[] = []
  const ranges: [number, number][] = []

  return {
    imports,
    ranges,
    walk: {
      enter(node) {
        if (node.type === 'ImportDeclaration') {
          if (virtualImports.includes(node.source.value as string)) {
            // @ts-expect-error missing types
            ranges.push([node.start, node.end])
            node.specifiers.forEach((i) => {
              if (i.type === 'ImportSpecifier') {
                const original = importMap.get(i.imported.name)
                if (!original)
                  throw new Error(`[unimport] failed to find "${i.imported.name}" imported from "${node.source.value}"`)
                imports.push({
                  from: original.from,
                  name: original.name,
                  as: i.local.name,
                })
              }
            })
          }
        }
      },
    } satisfies ArgumentsType<typeof walk>[1],
  }
}
