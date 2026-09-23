import type { BlockStatement, CatchClause, Function, Node, Pattern, Program } from 'estree'
import type MagicString from 'magic-string'
import type { Import, InjectImportsOptions, UnimportContext } from './types'
import { walk } from 'estree-walker'
import { getMagicString } from './utils'

export type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never

export function createEstreeDetector(parse: (code: string, id?: string) => Program) {
  return async (
    code: string | MagicString,
    ctx: UnimportContext,
    options?: InjectImportsOptions,
    id?: string,
  ) => {
    const s = getMagicString(code)
    const map = await ctx.getImportMap()

    let matchedImports: Import[] = []

    const enableAutoImport = options?.autoImport !== false
    const enableTransformVirtualImports = options?.transformVirtualImports !== false && ctx.options.virtualImports?.length

    if (enableAutoImport || enableTransformVirtualImports) {
      const ast = parse(s.original, id)

      const virtualImports = createVirtualImports(map, ctx.options.virtualImports)

      const scopes = traveseScopes(
        ast,
        (enableTransformVirtualImports)
          ? virtualImports.walk
          : {},
      )

      if (enableAutoImport) {
        const identifiers = scopes.unmatched
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

export interface Scope {
  node?: BlockStatement | Function | CatchClause
  parent?: Scope
  declarations: Set<string>
  references: Set<string>
}

export function traveseScopes(ast: Node, additionalWalk?: ArgumentsType<typeof walk>[1]) {
  const scopes: Scope[] = []
  let scopeCurrent: Scope = undefined!
  const scopesStack: Scope[] = []

  function pushScope(node: Scope['node']) {
    scopeCurrent = {
      node,
      parent: scopeCurrent,
      declarations: new Set(),
      references: new Set(),
    }
    scopes.push(scopeCurrent)
    scopesStack.push(scopeCurrent)
  }

  function popScope(node: Scope['node']) {
    const scope = scopesStack.pop()
    if (scope?.node !== node)
      throw new Error('Scope mismatch')
    scopeCurrent = scopesStack.at(-1)!
  }

  function declarePattern(node: Pattern) {
    switch (node.type) {
      case 'Identifier':
        scopeCurrent.declarations.add(node.name)
        return
      case 'ObjectPattern':
        for (const property of node.properties)
          declarePattern(property.type === 'Property' ? property.value : property.argument)
        return
      case 'ArrayPattern':
        for (const element of node.elements) {
          if (element)
            declarePattern(element)
        }
        return
      case 'AssignmentPattern':
        declarePattern(node.left)
        return
      case 'RestElement':
        declarePattern(node.argument)
    }
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
        case 'ClassDeclaration':
          if (node.id)
            scopeCurrent.declarations.add(node.id.name)
          return
        case 'VariableDeclarator':
          declarePattern(node.id)
          return

        // ====== Scope ======
        // parameters and catch bindings live in a scope of their own, so that
        // they are visible to the body (block or expression) but not to the
        // code surrounding the function
        case 'FunctionDeclaration':
          if (node.id)
            scopeCurrent.declarations.add(node.id.name)
          pushScope(node)
          for (const param of node.params)
            declarePattern(param)
          return
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
          pushScope(node)
          for (const param of node.params)
            declarePattern(param)
          return
        case 'CatchClause':
          pushScope(node)
          if (node.param)
            declarePattern(node.param)
          return
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
              if (parent.object === node || (parent.computed && parent.property === node))
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
            case 'PropertyDefinition':
              if (parent.value === node || (parent.computed && parent.key === node))
                scopeCurrent.references.add(node.name)
              return
            case 'MethodDefinition':
              if (parent.computed && parent.key === node)
                scopeCurrent.references.add(node.name)
              return
            case 'TemplateLiteral':
              if (parent.expressions.includes(node))
                scopeCurrent.references.add(node.name)
              return
            case 'AssignmentExpression':
            case 'AssignmentPattern': // e.g. function foo(p = bar) { ... }
            case 'ForOfStatement':
            case 'ForInStatement':
              if (parent.right === node)
                scopeCurrent.references.add(node.name)
              return
            case 'ReturnStatement':
            case 'ThrowStatement':
              if (parent.argument === node)
                scopeCurrent.references.add(node.name)
              return
            case 'ExportDefaultDeclaration':
              if (parent.declaration === node)
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
            case 'SwitchCase':
              if (parent.test === node)
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
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'CatchClause':
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

function createVirtualImports(
  importMap: Map<string, Import>,
  virtualImports: string[] = [],
): {
  imports: Import[]
  ranges: [number, number][]
  walk: ArgumentsType<typeof walk>[1]
} {
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
              if (i.type === 'ImportSpecifier' && i.imported.type === 'Identifier') {
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
