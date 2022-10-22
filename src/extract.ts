import os from 'os'
import { promises as fsp, existsSync, accessSync, constants } from 'fs'
import { resolveModuleExportNames } from 'mlly'
import { resolvePackageJSON, readPackageJSON } from 'pkg-types'
import { dirname, join } from 'pathe'
import { Import, PackagePreset } from './types'

// eslint-disable-next-line spaced-comment
const CACHE_PATH = /*#__PURE__*/ join(os.tmpdir(), 'unimport')
let CACHE_WRITEABLE: boolean | undefined

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
  const cachePath = join(CACHE_PATH, name + '@' + version, 'exports.json')

  /* c8 ignore next 8 */
  if (cache && CACHE_WRITEABLE === undefined) {
    try {
      CACHE_WRITEABLE = isWritable(CACHE_PATH)
    } catch {
      CACHE_WRITEABLE = false
    }
  }

  const useCache = cache && version && CACHE_WRITEABLE
  if (useCache && existsSync(cachePath)) {
    return JSON.parse(await fsp.readFile(cachePath, 'utf-8'))
  }

  const scanned = await resolveModuleExportNames(name, { url })
  /* c8 ignore next 4 */
  if (useCache) {
    await fsp.mkdir(dirname(cachePath), { recursive: true })
    await fsp.writeFile(cachePath, JSON.stringify(scanned), 'utf-8')
  }
  return scanned
}

function isWritable (filename: string): boolean {
  /* c8 ignore next 7 */
  try {
    accessSync(filename, constants.W_OK)
    return true
  } catch (e) {
    return false
  }
}
