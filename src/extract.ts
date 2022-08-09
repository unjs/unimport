import os from 'os'
import { promises as fsp, existsSync } from 'fs'
import { resolveModuleExportNames } from 'mlly'
import { resolvePackageJSON, readPackageJSON } from 'pkg-types'
import { dirname, join } from 'pathe'
import { Import, PackagePreset } from './types'

export async function resolvePackagePreset (preset: PackagePreset): Promise<Import[]> {
  const scanned: string[] = await extractExports(preset.package, preset.url, preset.cache)

  const filtered = scanned.filter((name) => {
    for (const item of preset.ignore || []) {
      if (typeof item === 'string' && item === name) {
        return false
      }
      if (item instanceof RegExp && item.test(name)) {
        return false
      }
      if (typeof item === 'function' && item(name) === false) {
        return false
      }
    }
    return true
  })

  return filtered.map(name => (<Import>{
    from: preset.package,
    name
  }))
}
async function extractExports (name: string, url?: string, cache = true) {
  const packageJsonPath = await resolvePackageJSON(name, { url })
  const packageJson = await readPackageJSON(packageJsonPath)
  const version = packageJson.version
  const cachePath = join(os.tmpdir(), 'unimport', name + '@' + version, 'exports.json')

  const hasCache = cache && existsSync(cachePath)
  const scanned: string[] = hasCache
    ? JSON.parse(await fsp.readFile(cachePath, 'utf-8'))
    : await resolveModuleExportNames(name, { url })

  if (!hasCache) {
    await fsp.mkdir(dirname(cachePath), { recursive: true })
    await fsp.writeFile(cachePath, JSON.stringify(scanned), 'utf-8')
  }

  return scanned
}
