'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const context = require('./chunks/context.cjs');
const vueTemplate = require('./chunks/vue-template.cjs');
require('fs');
require('fast-glob');
require('pathe');
require('mlly');
require('scule');
require('local-pkg');
require('magic-string');



exports.builtinPresets = context.builtinPresets;
exports.createUnimport = context.createUnimport;
exports.resolveBuiltinPresets = context.resolveBuiltinPresets;
exports.resolveFiles = context.resolveFiles;
exports.resolvePreset = context.resolvePreset;
exports.scanDirExports = context.scanDirExports;
exports.scanExports = context.scanExports;
exports.addImportToCode = vueTemplate.addImportToCode;
exports.dedupeImports = vueTemplate.dedupeImports;
exports.defineUnimportPreset = vueTemplate.defineUnimportPreset;
exports.excludeRE = vueTemplate.excludeRE;
exports.getMagicString = vueTemplate.getMagicString;
exports.getString = vueTemplate.getString;
exports.importAsRE = vueTemplate.importAsRE;
exports.matchRE = vueTemplate.matchRE;
exports.normalizeImports = vueTemplate.normalizeImports;
exports.separatorRE = vueTemplate.separatorRE;
exports.stripCommentsAndStrings = vueTemplate.stripCommentsAndStrings;
exports.toExports = vueTemplate.toExports;
exports.toImports = vueTemplate.toImports;
exports.toTypeDeclrationFile = vueTemplate.toTypeDeclrationFile;
exports.toTypeDeclrationItems = vueTemplate.toTypeDeclrationItems;
