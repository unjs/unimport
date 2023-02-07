import type { Unimport } from './context'
import type { Import, InstallGlobalOptions } from './types'

export async function installGlobalAutoImports (
  imports: Import[] | Unimport,
  options: InstallGlobalOptions = {}
) {
  const {
    globalObject = globalThis,
    overrides = false
  } = options

  imports = Array.isArray(imports)
    ? imports
    : await imports.getImports()

  await Promise.all(
    imports.map(async (i) => {
      if (i.disabled || i.type) {
        return
      }
      const as = i.as || i.name
      if (overrides || !(as in globalObject)) {
        const module = await import(i.from)
        globalObject[as] = module[i.name]
      }
    })
  )

  return globalObject
}
