'use strict';

const fs = require('fs');
const fg = require('fast-glob');
const pathe = require('pathe');
const mlly = require('mlly');
const scule = require('scule');
const vueTemplate = require('./vue-template.cjs');
const localPkg = require('local-pkg');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const fg__default = /*#__PURE__*/_interopDefaultLegacy(fg);

const pinia = vueTemplate.defineUnimportPreset({
  from: "pinia",
  imports: [
    "acceptHMRUpdate",
    "createPinia",
    "defineStore",
    "getActivePinia",
    "mapActions",
    "mapGetters",
    "mapState",
    "mapStores",
    "mapWritableState",
    "setActivePinia",
    "setMapStoreSuffix",
    "storeToRefs"
  ]
});

const preact = vueTemplate.defineUnimportPreset({
  from: "preact",
  imports: [
    "useState",
    "useCallback",
    "useMemo",
    "useEffect",
    "useRef",
    "useContext",
    "useReducer"
  ]
});

const quasar = vueTemplate.defineUnimportPreset({
  from: "quasar",
  imports: [
    "useQuasar",
    "useDialogPluginComponent",
    "useFormChild",
    "useMeta"
  ]
});

const react = vueTemplate.defineUnimportPreset({
  from: "react",
  imports: [
    "useState",
    "useCallback",
    "useMemo",
    "useEffect",
    "useRef",
    "useContext",
    "useReducer"
  ]
});

const ReactRouterHooks = [
  "useOutletContext",
  "useHref",
  "useInRouterContext",
  "useLocation",
  "useNavigationType",
  "useNavigate",
  "useOutlet",
  "useParams",
  "useResolvedPath",
  "useRoutes"
];
const reactRouter = vueTemplate.defineUnimportPreset({
  from: "react-router",
  imports: [
    ...ReactRouterHooks
  ]
});

const reactRouterDom = vueTemplate.defineUnimportPreset({
  from: "react-router-dom",
  imports: [
    ...ReactRouterHooks,
    "useLinkClickHandler",
    "useSearchParams",
    "Link",
    "NavLink",
    "Navigate",
    "Outlet",
    "Route",
    "Routes"
  ]
});

const svelteAnimate = vueTemplate.defineUnimportPreset({
  from: "svelte/animate",
  imports: [
    "flip"
  ]
});
const svelteEasing = vueTemplate.defineUnimportPreset({
  from: "svelte/easing",
  imports: [
    "back",
    "bounce",
    "circ",
    "cubic",
    "elastic",
    "expo",
    "quad",
    "quart",
    "quint",
    "sine"
  ].reduce((acc, e) => {
    acc.push(`${e}In`, `${e}Out`, `${e}InOut`);
    return acc;
  }, ["linear"])
});
const svelteStore = vueTemplate.defineUnimportPreset({
  from: "svelte/store",
  imports: [
    "writable",
    "readable",
    "derived",
    "get"
  ]
});
const svelteMotion = vueTemplate.defineUnimportPreset({
  from: "svelte/motion",
  imports: [
    "tweened",
    "spring"
  ]
});
const svelteTransition = vueTemplate.defineUnimportPreset({
  from: "svelte/transition",
  imports: [
    "fade",
    "blur",
    "fly",
    "slide",
    "scale",
    "draw",
    "crossfade"
  ]
});
const svelte = vueTemplate.defineUnimportPreset({
  from: "svelte",
  imports: [
    "onMount",
    "beforeUpdate",
    "afterUpdate",
    "onDestroy",
    "tick",
    "setContext",
    "getContext",
    "hasContext",
    "getAllContexts",
    "createEventDispatcher"
  ]
});

const veeValidate = vueTemplate.defineUnimportPreset({
  from: "vee-validate",
  imports: [
    "validate",
    "defineRule",
    "configure",
    "useField",
    "useForm",
    "useFieldArray",
    "useResetForm",
    "useIsFieldDirty",
    "useIsFieldTouched",
    "useIsFieldValid",
    "useIsSubmitting",
    "useValidateField",
    "useIsFormDirty",
    "useIsFormTouched",
    "useIsFormValid",
    "useValidateForm",
    "useSubmitCount",
    "useFieldValue",
    "useFormValues",
    "useFormErrors",
    "useFieldError",
    "useSubmitForm",
    "FormContextKey",
    "FieldContextKey"
  ]
});

const vitepress = vueTemplate.defineUnimportPreset({
  from: "vitepress",
  imports: [
    "useData",
    "useRoute",
    "useRouter",
    "withBase"
  ]
});

const CommonCompositionAPI = [
  "onActivated",
  "onBeforeMount",
  "onBeforeUnmount",
  "onBeforeUpdate",
  "onErrorCaptured",
  "onDeactivated",
  "onMounted",
  "onServerPrefetch",
  "onUnmounted",
  "onUpdated",
  "useAttrs",
  "useSlots",
  "computed",
  "customRef",
  "isReadonly",
  "isRef",
  "markRaw",
  "reactive",
  "readonly",
  "ref",
  "shallowReactive",
  "shallowReadonly",
  "shallowRef",
  "triggerRef",
  "toRaw",
  "toRef",
  "toRefs",
  "unref",
  "watch",
  "watchEffect",
  "defineComponent",
  "defineAsyncComponent",
  "getCurrentInstance",
  "h",
  "inject",
  "nextTick",
  "provide",
  "useCssModule",
  "createApp",
  "effectScope",
  "EffectScope",
  "getCurrentScope",
  "onScopeDispose"
];
const vue = vueTemplate.defineUnimportPreset({
  from: "vue",
  imports: [
    ...CommonCompositionAPI,
    "onRenderTracked",
    "onRenderTriggered",
    "resolveComponent",
    "useCssVars"
  ]
});

const vueMacros = vueTemplate.defineUnimportPreset({
  from: "vue/macros",
  imports: [
    "$",
    "$$",
    "$ref",
    "$shallowRef",
    "$toRef",
    "$customRef",
    "$computed"
  ]
});

const vueDemi = vueTemplate.defineUnimportPreset({
  from: "vue-demi",
  imports: CommonCompositionAPI
});

const vueI18n = vueTemplate.defineUnimportPreset({
  from: "vue-i18n",
  imports: [
    "useI18n"
  ]
});

const vueRouter = vueTemplate.defineUnimportPreset({
  from: "vue-router",
  imports: [
    "useRouter",
    "useRoute"
  ]
});

const vueCompositionApi = vueTemplate.defineUnimportPreset({
  from: "@vue/composition-api",
  imports: CommonCompositionAPI
});

let _cache;
const vueuseCore = () => {
  const excluded = ["toRefs", "utils"];
  if (!_cache) {
    try {
      const path = localPkg.resolveModule("@vueuse/core/indexes.json");
      const indexesJson = JSON.parse(fs.readFileSync(path, "utf-8"));
      _cache = vueTemplate.defineUnimportPreset({
        from: "@vueuse/core",
        imports: indexesJson.functions.filter((i) => ["core", "shared"].includes(i.package)).map((i) => i.name).filter((i) => i && i.length >= 4 && !excluded.includes(i))
      });
    } catch (error) {
      console.error(error);
      throw new Error("[auto-import] failed to load @vueuse/core, have you installed it?");
    }
  }
  return _cache;
};

const vueuseHead = vueTemplate.defineUnimportPreset({
  from: "@vueuse/head",
  imports: [
    "useHead"
  ]
});

const vuex = vueTemplate.defineUnimportPreset({
  from: "vuex",
  imports: [
    "createStore",
    "createLogger",
    "mapState",
    "mapGetters",
    "mapActions",
    "mapMutations",
    "createNamespacedHelpers",
    "useStore"
  ]
});

const vitest = vueTemplate.defineUnimportPreset({
  from: "vitest",
  imports: [
    "suite",
    "test",
    "describe",
    "it",
    "chai",
    "expect",
    "assert",
    "vitest",
    "vi",
    "beforeAll",
    "afterAll",
    "beforeEach",
    "afterEach"
  ]
});

const uniApp = vueTemplate.defineUnimportPreset({
  from: "@dcloudio/uni-app",
  imports: [
    "onAddToFavorites",
    "onBackPress",
    "onError",
    "onHide",
    "onLaunch",
    "onLoad",
    "onNavigationBarButtonTap",
    "onNavigationBarSearchInputChanged",
    "onNavigationBarSearchInputClicked",
    "onNavigationBarSearchInputConfirmed",
    "onNavigationBarSearchInputFocusChanged",
    "onPageNotFound",
    "onPageScroll",
    "onPullDownRefresh",
    "onReachBottom",
    "onReady",
    "onResize",
    "onShareAppMessage",
    "onShareTimeline",
    "onShow",
    "onTabItemTap",
    "onThemeChange",
    "onUnhandledRejection",
    "onUnload"
  ]
});

const solidCore = vueTemplate.defineUnimportPreset({
  from: "solid-js",
  imports: [
    "createSignal",
    "createEffect",
    "createMemo",
    "createResource",
    "onMount",
    "onCleanup",
    "onError",
    "untrack",
    "batch",
    "on",
    "createRoot",
    "mergeProps",
    "splitProps",
    "useTransition",
    "observable",
    "mapArray",
    "indexArray",
    "createContext",
    "useContext",
    "children",
    "lazy",
    "createDeferred",
    "createRenderEffect",
    "createSelector",
    "For",
    "Show",
    "Switch",
    "Match",
    "Index",
    "ErrorBoundary",
    "Suspense",
    "SuspenseList"
  ]
});
const solidStore = vueTemplate.defineUnimportPreset({
  from: "solid-js/store",
  imports: [
    "createStore",
    "produce",
    "reconcile",
    "createMutable"
  ]
});
const solidWeb = vueTemplate.defineUnimportPreset({
  from: "solid-js/web",
  imports: [
    "Dynamic",
    "hydrate",
    "render",
    "renderToString",
    "renderToStringAsync",
    "renderToStream",
    "isServer",
    "Portal"
  ]
});
const solid = vueTemplate.defineUnimportPreset({
  from: "solid-js",
  imports: [
    solidCore,
    solidStore,
    solidWeb
  ]
});

const solidAppRouter = vueTemplate.defineUnimportPreset({
  from: "solid-app-router",
  imports: [
    "Link",
    "NavLink",
    "Navigate",
    "Outlet",
    "Route",
    "Router",
    "Routes",
    "_mergeSearchString",
    "createIntegration",
    "hashIntegration",
    "normalizeIntegration",
    "pathIntegration",
    "staticIntegration",
    "useHref",
    "useIsRouting",
    "useLocation",
    "useMatch",
    "useNavigate",
    "useParams",
    "useResolvedPath",
    "useRouteData",
    "useRoutes",
    "useSearchParams"
  ]
});

const builtinPresets = {
  "@vue/composition-api": vueCompositionApi,
  "@vueuse/core": vueuseCore,
  "@vueuse/head": vueuseHead,
  pinia,
  preact,
  quasar,
  react,
  "react-router": reactRouter,
  "react-router-dom": reactRouterDom,
  svelte,
  "svelte/animate": svelteAnimate,
  "svelte/easing": svelteEasing,
  "svelte/motion": svelteMotion,
  "svelte/store": svelteStore,
  "svelte/transition": svelteTransition,
  "vee-validate": veeValidate,
  vitepress,
  "vue-demi": vueDemi,
  "vue-i18n": vueI18n,
  "vue-router": vueRouter,
  vue,
  "vue/macros": vueMacros,
  vuex,
  vitest,
  "uni-app": uniApp,
  "solid-js": solid,
  "solid-app-router": solidAppRouter
};

const commonProps = ["from", "priority", "disabled"];
function resolvePreset(preset) {
  const imports = [];
  const common = {};
  commonProps.forEach((i) => {
    if (i in preset) {
      common[i] = preset[i];
    }
  });
  for (const _import of preset.imports) {
    if (typeof _import === "string") {
      imports.push({ ...common, name: _import, as: _import });
    } else if (Array.isArray(_import)) {
      imports.push({ ...common, name: _import[0], as: _import[1] || _import[0], from: _import[2] || preset.from });
    } else if (_import.imports) {
      imports.push(...resolvePreset(_import));
    } else {
      imports.push({ ...common, ..._import });
    }
  }
  return imports;
}
function resolveBuiltinPresets(presets) {
  return presets.flatMap((p) => {
    let preset = typeof p === "string" ? builtinPresets[p] : p;
    if (typeof preset === "function") {
      preset = preset();
    }
    return resolvePreset(preset);
  });
}

async function resolveFiles(path, pattern) {
  const files = await fg__default(pattern, { cwd: path, followSymbolicLinks: true });
  return files.map((p) => pathe.resolve(path, p));
}
async function scanDirExports(dir, options) {
  const dirs = Array.isArray(dir) ? dir : [dir];
  const fileFilter = options?.fileFilter || (() => true);
  const files = await Promise.all(dirs.map((i) => resolveFiles(i, [
    "*.{ts,js,mjs,cjs,mts,cts}",
    "*/index.{ts,js,mjs,cjs,mts,cts}"
  ]))).then((r) => r.flat().filter(fileFilter));
  const imports = [];
  await Promise.all(files.map(async (path) => {
    imports.push(...await scanExports(path));
  }));
  return imports;
}
async function scanExports(filepath) {
  const imports = [];
  const code = await fs.promises.readFile(filepath, "utf-8");
  const exports = mlly.findExports(code);
  const defaultExport = exports.find((i) => i.type === "default");
  if (defaultExport) {
    let name = pathe.parse(filepath).name;
    if (name === "index") {
      name = pathe.parse(filepath.split("/").slice(0, -1).join("/")).name;
    }
    imports.push({ name: "default", as: scule.camelCase(name), from: filepath });
  }
  for (const exp of exports) {
    if (exp.type === "named") {
      for (const name of exp.names) {
        imports.push({ name, as: name, from: filepath });
      }
    } else if (exp.type === "declaration") {
      if (exp.name) {
        imports.push({ name: exp.name, as: exp.name, from: filepath });
      }
    }
  }
  return imports;
}

function createUnimport(opts) {
  let _combinedImports;
  const addons = [];
  if (Array.isArray(opts.addons)) {
    addons.push(...opts.addons);
  } else if (opts.addons?.vueTemplate) {
    addons.push(vueTemplate.vueTemplateAddon());
  }
  const ctx = {
    staticImports: [...opts.imports || []].filter(Boolean),
    dynamicImports: [],
    get imports() {
      if (!_combinedImports) {
        _combinedImports = reload();
      }
      return _combinedImports;
    },
    addons,
    map: /* @__PURE__ */ new Map(),
    invalidate() {
      _combinedImports = void 0;
    }
  };
  ctx.staticImports.push(...resolveBuiltinPresets(opts.presets || []));
  function reload() {
    const imports = vueTemplate.normalizeImports(vueTemplate.dedupeImports([...ctx.staticImports, ...ctx.dynamicImports], opts.warn || console.warn)).filter((i) => !i.disabled);
    ctx.map.clear();
    for (const _import of imports) {
      ctx.map.set(_import.as ?? _import.name, _import);
    }
    return imports;
  }
  async function modifyDynamicImports(fn) {
    const result = await fn(ctx.dynamicImports);
    if (Array.isArray(result)) {
      ctx.dynamicImports = result;
    }
    _combinedImports = void 0;
  }
  function clearDynamicImports() {
    ctx.dynamicImports.length = 0;
  }
  function generateTypeDecarations(options) {
    const opts2 = {
      resolvePath: (i) => i.from.replace(/\.ts$/, ""),
      ...options
    };
    let dts = vueTemplate.toTypeDeclrationFile(ctx.imports, opts2);
    for (const addon of ctx.addons) {
      dts = addon.decleration?.call(ctx, dts, opts2) ?? dts;
    }
    return dts;
  }
  reload();
  return {
    clearDynamicImports,
    modifyDynamicImports,
    getImports: () => ctx.imports,
    detectImports: (code) => detectImports(code, ctx),
    injectImports: (code, id, options) => injectImports(code, id, ctx, options),
    toExports: () => vueTemplate.toExports(ctx.imports),
    generateTypeDecarations
  };
}
async function detectImports(code, ctx) {
  const strippedCode = vueTemplate.stripCommentsAndStrings(vueTemplate.getString(code));
  const isCJSContext = mlly.detectSyntax(strippedCode).hasCJS;
  const identifiers = new Set(Array.from(strippedCode.matchAll(vueTemplate.matchRE)).map((i) => i[1]));
  for (const regex of vueTemplate.excludeRE) {
    Array.from(strippedCode.matchAll(regex)).flatMap((i) => [
      ...i[1]?.split(vueTemplate.separatorRE) || [],
      ...i[2]?.split(vueTemplate.separatorRE) || []
    ]).map((i) => i.replace(vueTemplate.importAsRE, "").trim()).forEach((i) => identifiers.delete(i));
  }
  let matchedImports = Array.from(identifiers).map((name) => ctx.map.get(name)).filter((i) => i && !i.disabled);
  for (const addon of ctx.addons) {
    matchedImports = await addon.matchImports?.call(ctx, identifiers, matchedImports) || matchedImports;
  }
  return {
    strippedCode,
    isCJSContext,
    matchedImports
  };
}
async function injectImports(code, id, ctx, options) {
  const s = vueTemplate.getMagicString(code);
  for (const addon of ctx.addons) {
    await addon.transform?.call(ctx, s, id);
  }
  const { isCJSContext, matchedImports } = await detectImports(s, ctx);
  return vueTemplate.addImportToCode(s, matchedImports, isCJSContext, options?.mergeExisting);
}

exports.builtinPresets = builtinPresets;
exports.createUnimport = createUnimport;
exports.resolveBuiltinPresets = resolveBuiltinPresets;
exports.resolveFiles = resolveFiles;
exports.resolvePreset = resolvePreset;
exports.scanDirExports = scanDirExports;
exports.scanExports = scanExports;
