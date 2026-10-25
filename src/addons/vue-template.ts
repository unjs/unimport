import type { Addon, Import } from '../types'
import { stringifyImports } from '../utils'

const RE_CONTEXT = /\b_ctx\.([$\w]+)\b/g
const UNREF_KEY = '__unimport_unref_'

export const VUE_TEMPLATE_NAME = 'unimport:vue-template'

export function vueTemplateAddon(): Addon {
  const self: Addon = {
    name: VUE_TEMPLATE_NAME,
    async transform(s, id) {
      if (!s.original.includes('_ctx.') || s.original.includes(UNREF_KEY))
        return s

      const matches = Array.from(s.original.matchAll(RE_CONTEXT))
      const imports = await this.getImports()
      let targets: Import[] = []
      let indexed: Map<string | undefined, Import> | undefined
      let canIndex = true
      let scanned = 0
      let remaining = matches.length
      const targetAliases = new Set<string>()

      for (const match of matches) {
        // Keep cheap lookups linear and only index when enough work remains.
        if (canIndex && remaining >= 16 && scanned > imports.length * 4) {
          canIndex = false
          indexed = indexImports(imports)
        }
        remaining--
        const name = match[1]
        const item = indexed
          ? indexed.get(name)
          : imports.find((i) => {
              scanned++
              return i.as === name
            })
        if (!item)
          continue

        const start = match.index!
        const end = start + match[0].length

        const tempName = `__unimport_${name}`
        s.overwrite(start, end, `(${JSON.stringify(name)} in _ctx ? _ctx.${name} : ${UNREF_KEY}(${tempName}))`)
        if (!targetAliases.has(tempName)) {
          targetAliases.add(tempName)
          // Spreading an import can invoke getters that change other aliases.
          if (indexed && Reflect.ownKeys(item).some(key => Object.getOwnPropertyDescriptor(item, key)?.get))
            indexed = undefined
          targets.push({
            ...item,
            as: tempName,
          })
        }
      }

      if (targets.length) {
        targets.push({
          name: 'unref',
          from: 'vue',
          as: UNREF_KEY,
        })

        for (const addon of this.addons) {
          if (addon === self)
            continue

          targets = await addon.injectImportsResolved?.call(this, targets, s, id) ?? targets
        }

        let injection = stringifyImports(targets)
        for (const addon of this.addons) {
          if (addon === self)
            continue

          injection = await addon.injectImportsStringified?.call(this, injection, targets, s, id) ?? injection
        }

        s.prepend(injection)
      }

      return s
    },
    async declaration(dts, options) {
      const imports = await this.getImports()
      const items = imports
        .map((i) => {
          if (i.type || i.dtsDisabled)
            return ''
          const from = options?.resolvePath?.(i) || i.from
          return `readonly ${i.as}: UnwrapRef<typeof import('${from}')${i.name !== '*' ? `['${i.name}']` : ''}>`
        })
        .filter(Boolean)
        .sort()

      const extendItems = items.map(i => `    ${i}`).join('\n')
      return `${dts}
// for vue template auto import
import { UnwrapRef } from 'vue'
declare module 'vue' {
  interface ComponentCustomProperties {
${extendItems}
  }
}`
    },
  }

  return self
}

function indexImports(imports: Import[]): Map<string | undefined, Import> | undefined {
  const indexed = new Map<string | undefined, Import>()
  for (let index = 0; index < imports.length; index++) {
    const entry = Object.getOwnPropertyDescriptor(imports, index)
    if (!entry || !('value' in entry))
      return
    const item: Import = entry.value
    const alias = Object.getOwnPropertyDescriptor(item, 'as')
    // Keep getter-backed imports on the original lookup path.
    if (!alias || !('value' in alias))
      return
    if (!indexed.has(alias.value))
      indexed.set(alias.value, item)
  }
  return indexed
}
