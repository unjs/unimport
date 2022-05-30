import { P as Preset, I as Import, B as BuiltinPresetName, T as TypeDeclrationOptions, S as ScanDirExportsOptions, U as UnimportOptions, a as Thenable, b as InjectImportsOptions } from './types-40a2cd16.js';
export { i as Addon, A as AddonsOptions, B as BuiltinPresetName, I as Import, e as ImportCommon, d as ImportName, b as InjectImportsOptions, M as ModuleId, h as PathFromResolver, P as Preset, f as PresetImport, S as ScanDirExportsOptions, a as Thenable, T as TypeDeclrationOptions, g as UnimportContext, U as UnimportOptions, c as builtinPresets } from './types-40a2cd16.js';
import MagicString from 'magic-string';

declare function resolvePreset(preset: Preset): Import[];
declare function resolveBuiltinPresets(presets: (BuiltinPresetName | Preset)[]): Import[];

declare const excludeRE: RegExp[];
declare const importAsRE: RegExp;
declare const separatorRE: RegExp;
declare const matchRE: RegExp;
declare function defineUnimportPreset(preset: Preset): Preset;
declare function stripCommentsAndStrings(code: string): string;
declare function toImports(imports: Import[], isCJS?: boolean): string;
declare function dedupeImports(imports: Import[], warn: (msg: string) => void): Import[];
declare function toExports(imports: Import[]): string;
declare function toTypeDeclrationItems(imports: Import[], options?: TypeDeclrationOptions): string[];
declare function toTypeDeclrationFile(imports: Import[], options?: TypeDeclrationOptions): string;
declare function getString(code: string | MagicString): string;
declare function getMagicString(code: string | MagicString): MagicString;
declare function addImportToCode(code: string | MagicString, imports: Import[], isCJS?: boolean, mergeExisting?: boolean): {
    s: MagicString;
    code: string;
};
declare function normalizeImports(imports: Import[]): Import[];

declare function resolveFiles(path: string, pattern: string | string[]): Promise<string[]>;
declare function scanDirExports(dir: string | string[], options?: ScanDirExportsOptions): Promise<Import[]>;
declare function scanExports(filepath: string): Promise<Import[]>;

declare type Unimport = ReturnType<typeof createUnimport>;
declare function createUnimport(opts: Partial<UnimportOptions>): {
    clearDynamicImports: () => void;
    modifyDynamicImports: (fn: (imports: Import[]) => Thenable<void | Import[]>) => Promise<void>;
    getImports: () => Import[];
    detectImports: (code: string) => Promise<{
        strippedCode: string;
        isCJSContext: boolean;
        matchedImports: Import[];
    }>;
    injectImports: (code: string | MagicString, id?: string, options?: InjectImportsOptions) => Promise<{
        s: MagicString;
        code: string;
    }>;
    toExports: () => string;
    generateTypeDecarations: (options?: TypeDeclrationOptions) => string;
};

export { Unimport, addImportToCode, createUnimport, dedupeImports, defineUnimportPreset, excludeRE, getMagicString, getString, importAsRE, matchRE, normalizeImports, resolveBuiltinPresets, resolveFiles, resolvePreset, scanDirExports, scanExports, separatorRE, stripCommentsAndStrings, toExports, toImports, toTypeDeclrationFile, toTypeDeclrationItems };
