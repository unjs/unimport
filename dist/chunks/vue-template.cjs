'use strict';

const mlly = require('mlly');
const MagicString = require('magic-string');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const MagicString__default = /*#__PURE__*/_interopDefaultLegacy(MagicString);

const excludeRE = [
  /\bimport\s*(.+?)\s*from\b/gs,
  /\bfunction\s*([\w_$]+?)\s*\(/gs,
  /\bclass\s*([\w_$]+?)\s*{/gs,
  /\b(?:const|let|var)\s+?(\[.*?\]|\{.*?\}|.+?)\s*?[=;\n]/gs
];
const importAsRE = /^.*\sas\s+/;
const separatorRE = /[,[\]{}\n]/g;
const matchRE = /(?<![\w_$/)]\.)([\w_$]+)\s*(?:[.()[\];+*&|`<>,\n-])/g;
const regexRE = /\/.*?(?<!\\)(?<!\[[^\]]*)\/[gimsuy]*/g;
const multilineCommentsRE = /\/\*.*?\*\//gms;
const singlelineCommentsRE = /\/\/.*$/gm;
const templateLiteralRE = /\$\{\s*((?:(?!\$\{).|\n|\r)*?)\s*\}/g;
const quotesRE = [
  /(["'`])((?:\\\1|(?!\1)|.|\r)*?)\1/gm,
  /([`])((?:\\\1|(?!\1)|.|\n|\r)*?)\1/gm
];
function defineUnimportPreset(preset) {
  return preset;
}
function stripCommentsAndStrings(code) {
  code = code.replace(multilineCommentsRE, "").replace(singlelineCommentsRE, "");
  for (let i = 0; i < 16; i++) {
    const originalCode = code;
    code = code.replace(templateLiteralRE, "` + $1 + `");
    if (code === originalCode) {
      break;
    }
  }
  return code.replace(regexRE, 'new RegExp("")').replace(quotesRE[0], "$1$1").replace(quotesRE[1], "``");
}
function toImports(imports, isCJS = false) {
  const map = toImportModuleMap(imports);
  return Object.entries(map).flatMap(([name, importSet]) => {
    const entries = [];
    const imports2 = Array.from(importSet).filter((i) => {
      if (!i.name || i.as === "") {
        entries.push(isCJS ? `require('${name}');` : `import '${name}';`);
        return false;
      } else if (i.name === "default") {
        entries.push(isCJS ? `const { default: ${i.as} } = require('${name}');` : `import ${i.as} from '${name}';`);
        return false;
      } else if (i.name === "*") {
        entries.push(isCJS ? `const ${i.as} = require('${name}');` : `import * as ${i.as} from '${name}';`);
        return false;
      }
      return true;
    });
    if (imports2.length) {
      const importsAs = imports2.map((i) => stringifyImportAlias(i, isCJS));
      entries.push(isCJS ? `const { ${importsAs.join(", ")} } = require('${name}');` : `import { ${importsAs.join(", ")} } from '${name}';`);
    }
    return entries;
  }).join("\n");
}
function dedupeImports(imports, warn) {
  const map = /* @__PURE__ */ new Map();
  const indexToRemove = /* @__PURE__ */ new Set();
  imports.filter((i) => !i.disabled).forEach((i, idx) => {
    const name = i.as ?? i.name;
    if (!map.has(name)) {
      map.set(name, idx);
      return;
    }
    const other = imports[map.get(name)];
    if (other.from === i.from) {
      indexToRemove.add(idx);
      return;
    }
    const diff = (other.priority || 1) - (i.priority || 1);
    if (diff === 0) {
      warn(`Duplicated imports "${name}", the one from "${other.from}" has been ignored`);
    }
    if (diff <= 0) {
      indexToRemove.add(map.get(name));
      map.set(name, idx);
    } else {
      indexToRemove.add(idx);
    }
  });
  return imports.filter((_, idx) => !indexToRemove.has(idx));
}
function toExports(imports) {
  const map = toImportModuleMap(imports);
  return Object.entries(map).flatMap(([name, imports2]) => {
    name = name.replace(/\.[a-z]+$/, "");
    const entries = [];
    const filtered = Array.from(imports2).filter((i) => {
      if (i.name === "*") {
        entries.push(`export * as ${i.as} from '${name}';`);
        return false;
      }
      return true;
    });
    if (filtered.length) {
      entries.push(`export { ${filtered.map((i) => stringifyImportAlias(i, false)).join(", ")} } from '${name}';`);
    }
    return entries;
  }).join("\n");
}
function toTypeDeclrationItems(imports, options) {
  return imports.map((i) => {
    const from = options?.resolvePath?.(i) || i.from;
    return `const ${i.as}: typeof import('${from}')${i.name !== "*" ? `['${i.name}']` : ""}`;
  }).sort();
}
function toTypeDeclrationFile(imports, options) {
  const items = toTypeDeclrationItems(imports, options);
  const {
    exportHelper = true
  } = options || {};
  let declration = "";
  if (exportHelper) {
    declration += "export {}\n";
  }
  declration += "declare global {\n" + items.map((i) => "  " + i).join("\n") + "\n}";
  return declration;
}
function stringifyImportAlias(item, isCJS = false) {
  return item.as === void 0 || item.name === item.as ? item.name : isCJS ? `${item.name}: ${item.as}` : `${item.name} as ${item.as}`;
}
function toImportModuleMap(imports) {
  const map = {};
  for (const _import of imports) {
    if (!map[_import.from]) {
      map[_import.from] = /* @__PURE__ */ new Set();
    }
    map[_import.from].add(_import);
  }
  return map;
}
function getString(code) {
  if (typeof code === "string") {
    return code;
  }
  return code.toString();
}
function getMagicString(code) {
  if (typeof code === "string") {
    return new MagicString__default(code);
  }
  return code;
}
function addImportToCode(code, imports, isCJS = false, mergeExisting = false) {
  let newImports = [];
  const s = getMagicString(code);
  if (mergeExisting && !isCJS) {
    const existing = mlly.findStaticImports(s.original).map((i) => mlly.parseStaticImport(i));
    const map = /* @__PURE__ */ new Map();
    imports.forEach((i) => {
      const target = existing.find((e) => e.specifier === i.from && e.imports.startsWith("{"));
      if (!target) {
        return newImports.push(i);
      }
      if (!map.has(target)) {
        map.set(target, []);
      }
      map.get(target).push(i);
    });
    for (const [target, items] of map.entries()) {
      const strings = items.map((i) => stringifyImportAlias(i) + ", ");
      const importLength = target.code.match(/^\s*import\s*{/)?.[0]?.length;
      if (importLength) {
        s.appendLeft(target.start + importLength, " " + strings.join("").trim());
      }
    }
  } else {
    newImports = imports;
  }
  const newEntries = toImports(newImports, isCJS);
  if (newEntries) {
    s.prepend(newEntries + "\n");
  }
  return {
    s,
    code: s.toString()
  };
}
function normalizeImports(imports) {
  for (const _import of imports) {
    _import.as = _import.as ?? _import.name;
  }
  return imports;
}

const contextRE = /\b_ctx\.([\w_]+)\b/g;
const vueTemplateAddon = () => ({
  transform(s) {
    if (!s.original.includes("_ctx.")) {
      return s;
    }
    const matches = Array.from(s.original.matchAll(contextRE));
    const imports = this.imports;
    const targets = [];
    for (const match of matches) {
      const name = match[1];
      const item = imports.find((i) => i.as === name);
      if (!item) {
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      const tempName = "__unimport_" + name;
      s.overwrite(start, end, tempName);
      if (!targets.find((i) => i.as === tempName)) {
        targets.push({
          ...item,
          as: tempName
        });
      }
    }
    if (targets.length) {
      s.prepend(toImports(targets));
    }
    return s;
  },
  decleration(dts, options) {
    const items = toTypeDeclrationItems(this.imports, options).map((i) => i.replace("const ", ""));
    return dts + `
// for vue template auto import
declare module 'vue' {
  interface ComponentCustomProperties {
${items.map((i) => "    " + i).join("\n")}
  }
}
`;
  }
});

exports.addImportToCode = addImportToCode;
exports.dedupeImports = dedupeImports;
exports.defineUnimportPreset = defineUnimportPreset;
exports.excludeRE = excludeRE;
exports.getMagicString = getMagicString;
exports.getString = getString;
exports.importAsRE = importAsRE;
exports.matchRE = matchRE;
exports.normalizeImports = normalizeImports;
exports.separatorRE = separatorRE;
exports.stripCommentsAndStrings = stripCommentsAndStrings;
exports.toExports = toExports;
exports.toImports = toImports;
exports.toTypeDeclrationFile = toTypeDeclrationFile;
exports.toTypeDeclrationItems = toTypeDeclrationItems;
exports.vueTemplateAddon = vueTemplateAddon;
