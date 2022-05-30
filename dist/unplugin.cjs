'use strict';

const fs = require('fs');
const unplugin$1 = require('unplugin');
const pluginutils = require('@rollup/pluginutils');
const MagicString = require('magic-string');
const context = require('./chunks/context.cjs');
require('fast-glob');
require('pathe');
require('mlly');
require('scule');
require('./chunks/vue-template.cjs');
require('local-pkg');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const MagicString__default = /*#__PURE__*/_interopDefaultLegacy(MagicString);

const unplugin = unplugin$1.createUnplugin((options = {}) => {
  const ctx = context.createUnimport(options);
  const filter = pluginutils.createFilter(options.include || [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/], options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]);
  const dts = options.dts === true ? "unimport.d.ts" : options.dts;
  return {
    name: "unimport",
    enforce: "post",
    transformInclude(id) {
      return filter(id);
    },
    async transform(code, id) {
      const s = new MagicString__default(code);
      await ctx.injectImports(s, id);
      if (!s.hasChanged()) {
        return;
      }
      return {
        code: s.toString(),
        map: s.generateMap()
      };
    },
    async buildStart() {
      if (options.dirs?.length) {
        await ctx.modifyDynamicImports(async (imports) => {
          imports.push(...await context.scanDirExports(options.dirs));
        });
      }
      if (dts) {
        return fs.promises.writeFile(dts, ctx.generateTypeDecarations(), "utf-8");
      }
    }
  };
});

module.exports = unplugin;
