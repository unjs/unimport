import { expect, it } from 'vitest'

it('public-api', async () => {
  const keys = await import('../src').then(r => Object.keys(r).sort())

  expect(keys)
    .toMatchInlineSnapshot(`
      [
        "addImportToCode",
        "builtinPresets",
        "createUnimport",
        "dedupeDtsExports",
        "dedupeImports",
        "defineUnimportPreset",
        "excludeRE",
        "getMagicString",
        "getString",
        "importAsRE",
        "installGlobalAutoImports",
        "matchRE",
        "normalizeImports",
        "resolveBuiltinPresets",
        "resolveIdAbsolute",
        "resolvePreset",
        "scanDirExports",
        "scanExports",
        "scanFilesFromDir",
        "separatorRE",
        "stringifyImports",
        "stripCommentsAndStrings",
        "toExports",
        "toImports",
        "toTypeDeclarationFile",
        "toTypeDeclarationItems",
        "toTypeReExports",
        "version",
        "vueTemplateAddon",
      ]
    `)
})
