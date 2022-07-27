# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.6.4](https://github.com/unjs/unimport/compare/v0.6.3...v0.6.4) (2022-07-27)

### [0.6.3](https://github.com/unjs/unimport/compare/v0.6.2...v0.6.3) (2022-07-24)


### Bug Fixes

* normalize path for windows ([4849f77](https://github.com/unjs/unimport/commit/4849f77a14f50d2afbebdd264166ee5efaf0aade))
* **scan:** normlaize directories ([aa5a354](https://github.com/unjs/unimport/commit/aa5a354f918707368e82f8f54a5836c2d7d4d7fb))

### [0.6.2](https://github.com/unjs/unimport/compare/v0.6.1...v0.6.2) (2022-07-22)


### Features

* `toExports` support relative path ([c34f027](https://github.com/unjs/unimport/commit/c34f027b32d5efd0bc0270783c59b13c813d7a44))

### [0.6.1](https://github.com/unjs/unimport/compare/v0.6.0...v0.6.1) (2022-07-21)


### Bug Fixes

* **scan:** sort glob for stable result ([5fd42aa](https://github.com/unjs/unimport/commit/5fd42aadfc63337ce3a737fb2450b3a5a2640459))

## [0.6.0](https://github.com/unjs/unimport/compare/v0.5.0...v0.6.0) (2022-07-21)


### ⚠ BREAKING CHANGES

* **scan:** options for custom `filePatterns`, remove nested glob by default (#95)

### Features

* **scan:** options for custom `filePatterns`, remove nested glob by default ([#95](https://github.com/unjs/unimport/issues/95)) ([bbec5c0](https://github.com/unjs/unimport/commit/bbec5c08a20d38a60c78834bbe9b3283559c3835))

## [0.5.0](https://github.com/unjs/unimport/compare/v0.4.7...v0.5.0) (2022-07-21)


### ⚠ BREAKING CHANGES

* **dir:** support glob pattern in `dirs` (#86)

### Features

* **dir:** support glob pattern in `dirs` ([#86](https://github.com/unjs/unimport/issues/86)) ([08bc27a](https://github.com/unjs/unimport/commit/08bc27a330994c0fae67894eee9b31cfd341be5e))

### [0.4.7](https://github.com/unjs/unimport/compare/v0.4.6...v0.4.7) (2022-07-21)

### [0.4.6](https://github.com/unjs/unimport/compare/v0.4.5...v0.4.6) (2022-07-21)

### [0.4.5](https://github.com/unjs/unimport/compare/v0.4.4...v0.4.5) (2022-07-14)

### [0.4.4](https://github.com/unjs/unimport/compare/v0.4.3...v0.4.4) (2022-07-08)


### Bug Fixes

* **unplugin:** use default includes when `include` is provide as an empty array ([78e8d74](https://github.com/unjs/unimport/commit/78e8d7416b2ea723167777cc3a1175109e850358)), closes [/github.com/unjs/nitro/pull/295#issuecomment-1156519293](https://github.com/unjs//github.com/unjs/nitro/pull/295/issues/issuecomment-1156519293)

### [0.4.3](https://github.com/unjs/unimport/compare/v0.4.2...v0.4.3) (2022-07-07)


### Features

* transform virtual imports ([#85](https://github.com/unjs/unimport/issues/85)) ([07277e6](https://github.com/unjs/unimport/commit/07277e6536db1c8c58bb6cb345ab0b3b4af6e1ad))


### Bug Fixes

* don't auto-import for exports from other modules ([#87](https://github.com/unjs/unimport/issues/87)) ([4c345a4](https://github.com/unjs/unimport/commit/4c345a4fbff161828bd0e7330e14e3504ab62a35))

### [0.4.2](https://github.com/unjs/unimport/compare/v0.4.1...v0.4.2) (2022-07-06)


### Bug Fixes

* regex replacement false-negative ([1f9e35d](https://github.com/unjs/unimport/commit/1f9e35d94df19461941decd05160b8aded2809c9))

### [0.4.1](https://github.com/unjs/unimport/compare/v0.4.0...v0.4.1) (2022-07-01)


### Bug Fixes

* improve switch detection ([2fb10ef](https://github.com/unjs/unimport/commit/2fb10ef9404db713ad68bab60732ff72072cd0dd))

## [0.4.0](https://github.com/unjs/unimport/compare/v0.3.0...v0.4.0) (2022-06-24)


### Bug Fixes

* spelling of declaration ([#81](https://github.com/unjs/unimport/issues/81)) ([f371b9b](https://github.com/unjs/unimport/commit/f371b9b109c65b9c813be5917a820701cba9379b))
* **vue-template:** augmente types with `@vue/runtime-core` ([#80](https://github.com/unjs/unimport/issues/80)) ([7c83d44](https://github.com/unjs/unimport/commit/7c83d4460807ffe8d1108440f27c032c25824840))

## [0.3.0](https://github.com/unjs/unimport/compare/v0.2.10...v0.3.0) (2022-06-22)


### ⚠ BREAKING CHANGES

* **vue-template:** auto unwrap (#72)

### Features

* **vue-template:** auto unwrap ([#72](https://github.com/unjs/unimport/issues/72)) ([741015b](https://github.com/unjs/unimport/commit/741015b9cd4fc45c1ca75cf05ef3c8e6aa39dd69))

### [0.2.10](https://github.com/unjs/unimport/compare/v0.2.9...v0.2.10) (2022-06-22)


### Features

* new `resolveId` options ([#73](https://github.com/unjs/unimport/issues/73)) ([6f83408](https://github.com/unjs/unimport/commit/6f83408e78591ed4792ff8487953af17c9327958))


### Bug Fixes

* improve match re, close [#79](https://github.com/unjs/unimport/issues/79) ([36403af](https://github.com/unjs/unimport/commit/36403af1ced8e5514121c80f3566785aa0f1e264))

### [0.2.9](https://github.com/unjs/unimport/compare/v0.2.8...v0.2.9) (2022-06-14)


### Bug Fixes

* keep `ctx.map` up-to-date, close [#71](https://github.com/unjs/unimport/issues/71) ([6a31073](https://github.com/unjs/unimport/commit/6a310730a34f5c3f875acd61a19b440b3df988da))

### [0.2.8](https://github.com/unjs/unimport/compare/v0.2.7...v0.2.8) (2022-06-13)


### Bug Fixes

* use regex as fallback of `strip-literal` ([c43ffe3](https://github.com/unjs/unimport/commit/c43ffe3efa3fcff3c94528eb4eff301923c6b57f))

### [0.2.7](https://github.com/unjs/unimport/compare/v0.2.6...v0.2.7) (2022-06-10)


### Bug Fixes

* strict cjs syntax detection ([efd81c7](https://github.com/unjs/unimport/commit/efd81c75ce8abf4f7c14be7058b4638c662341b7))

### [0.2.6](https://github.com/unjs/unimport/compare/v0.2.5...v0.2.6) (2022-05-31)


### Bug Fixes

* nested quotes in template string, multiline template string ([#49](https://github.com/unjs/unimport/issues/49)) ([#58](https://github.com/unjs/unimport/issues/58)) ([d5921ae](https://github.com/unjs/unimport/commit/d5921ae69553ad4a3092223e43df038d5c715505))
* use `strip-literal` for more correct comments removal ([#60](https://github.com/unjs/unimport/issues/60)) ([087407e](https://github.com/unjs/unimport/commit/087407e0d7a6f88bdce3be3c15dd4236c4368ca9))

### [0.2.5](https://github.com/unjs/unimport/compare/v0.2.4...v0.2.5) (2022-05-29)


### Bug Fixes

* no space in comment ([#56](https://github.com/unjs/unimport/issues/56)) ([720d164](https://github.com/unjs/unimport/commit/720d164ee90e564a2a9441a2381540391c33b525))
* slash in regex ([#52](https://github.com/unjs/unimport/issues/52)) ([685c320](https://github.com/unjs/unimport/commit/685c32093a37195f3844048f1f69494eb06f7c69))
* space in template literal ([#55](https://github.com/unjs/unimport/issues/55)) ([55bcb46](https://github.com/unjs/unimport/commit/55bcb46e392067d683d44efeb8bb6c7cf11f3d62))

### [0.2.4](https://github.com/unjs/unimport/compare/v0.2.3...v0.2.4) (2022-05-25)


### Bug Fixes

* exclude existing class define ([94c3a7d](https://github.com/unjs/unimport/commit/94c3a7dfa9cbe8ac392322fecf34f03cf707c58d))
* regexes break with unbalanced backticks ([#51](https://github.com/unjs/unimport/issues/51)) ([c6764ba](https://github.com/unjs/unimport/commit/c6764bafc0b800459167944fdf4ac782a03bd341))

### [0.2.3](https://github.com/unjs/unimport/compare/v0.2.2...v0.2.3) (2022-05-24)


### Bug Fixes

* **types:** redirect sub module types ([5314d44](https://github.com/unjs/unimport/commit/5314d44c19f66d5df8c46f1687222a594a98c642))

### [0.2.2](https://github.com/unjs/unimport/compare/v0.2.1...v0.2.2) (2022-05-24)


### Features

* allow `modifyDynamicImports` to replace array ([abcb52c](https://github.com/unjs/unimport/commit/abcb52cc12524e264e7d0c9ed985373b50ce8728))
* expose addons ([a954785](https://github.com/unjs/unimport/commit/a9547851f78775a266f1718a50a14ff956698684))
* improve addons API ([bd92eac](https://github.com/unjs/unimport/commit/bd92eac74566148a7f0c525dfc938d61372d7245))
* improve coverage ([37d39a0](https://github.com/unjs/unimport/commit/37d39a030741bf443152caa402741e72ef32036e))
* support importing side-effects ([0d2da20](https://github.com/unjs/unimport/commit/0d2da20ea08e727c3bf9a9a98b29afc8b7f5f506))


### Bug Fixes

* don't match identifiers starts with `.` ([6cddef4](https://github.com/unjs/unimport/commit/6cddef49d93346069f112ebeae9f1fd93d01c125))
* improve match regex ([0e68fd7](https://github.com/unjs/unimport/commit/0e68fd72c18af7bf8c1c9402a06d5742978f1776))
* sort dts entries ([3d71eef](https://github.com/unjs/unimport/commit/3d71eef9f43cbb0d34c55a6d915d57b2d29146b6))

### [0.2.1](https://github.com/unjs/unimport/compare/v0.1.9...v0.2.1) (2022-05-10)


### Features

* auto import for Vue template ([#15](https://github.com/unjs/unimport/issues/15)) ([136fb32](https://github.com/unjs/unimport/commit/136fb322f46be47cc5cc318111cf2ea5728afa07))


### Bug Fixes

* **vue-template:** webpack compatibility ([ffc71dc](https://github.com/unjs/unimport/commit/ffc71dc33793d7b73007a85dd747d95d42975c71))

## [0.2.0](https://github.com/unjs/unimport/compare/v0.1.9...v0.2.0) (2022-05-10)


### Features

* auto import for template working! ([3453042](https://github.com/unjs/unimport/commit/3453042167ed01eb6c12ba6e832ace30e2bbe9cc))
* dts generation ([2e4dcdc](https://github.com/unjs/unimport/commit/2e4dcdcfbf4266800af3a013ce56e3293e7dfdc1))
* introduce addon system ([c788851](https://github.com/unjs/unimport/commit/c7888514ab6a41def867b4080def4377a547fc2d))
* options for vue template auto import ([c242918](https://github.com/unjs/unimport/commit/c242918e6f706160d2d58b8593571d2fb6bc74d4))
* **unplugin:** support auto import fomr directory ([a8d17c2](https://github.com/unjs/unimport/commit/a8d17c2fcbd2d74e0d0c9eda7ef76780ffc57811))


### Bug Fixes

* support auto import for variables ([4059581](https://github.com/unjs/unimport/commit/40595815a865c97389ff2a7380c9a1f338ede00d))

### [0.1.9](https://github.com/unjs/unimport/compare/v0.1.8...v0.1.9) (2022-05-09)


### Bug Fixes

* detect function argument ends with comma ([29365cd](https://github.com/unjs/unimport/commit/29365cddf34d972232f2dbfd6194244c34a1a277))

### [0.1.8](https://github.com/unjs/unimport/compare/v0.1.7...v0.1.8) (2022-04-28)


### Bug Fixes

* correctly dedupe ([08f5282](https://github.com/unjs/unimport/commit/08f528200b773a5b5be1cc168c40779098b04cce))

### [0.1.7](https://github.com/unjs/unimport/compare/v0.1.6...v0.1.7) (2022-04-26)


### Features

* expose `clearDynamicImports` to context ([2f82f0a](https://github.com/unjs/unimport/commit/2f82f0a761b7c10bfea0cbc94edb6c0f7c7b421c))


### Bug Fixes

* dedupe imports from same source ([7faa56f](https://github.com/unjs/unimport/commit/7faa56f71bde9f89767da6cd74fd624445915014))

### [0.1.6](https://github.com/unjs/unimport/compare/v0.1.5...v0.1.6) (2022-04-20)


### Bug Fixes

* support ts generic ([c085469](https://github.com/unjs/unimport/commit/c08546972432b9a9fcf20d42dc41124d2e6f66c6))

### [0.1.5](https://github.com/unjs/unimport/compare/v0.1.4...v0.1.5) (2022-04-13)


### Bug Fixes

* support template tag ([a1ab167](https://github.com/unjs/unimport/commit/a1ab1674543c7493cb01e2ad638537739414c4ee))

### [0.1.4](https://github.com/unjs/unimport/compare/v0.1.3...v0.1.4) (2022-04-05)


### Bug Fixes

* template literal detection ([3ea56ff](https://github.com/unjs/unimport/commit/3ea56fffb02d4efb7760526023601196a721a718))

### [0.1.3](https://github.com/unjs/unimport/compare/v0.1.2...v0.1.3) (2022-03-24)


### Bug Fixes

* remove disabled imports before deduplicating ([#14](https://github.com/unjs/unimport/issues/14)) ([d17b29d](https://github.com/unjs/unimport/commit/d17b29d3f96b2e64bde0f59463b0b313ee10f548))

### [0.1.2](https://github.com/unjs/unimport/compare/v0.1.1...v0.1.2) (2022-03-23)


### Features

* supports `disabled` flag on `Import` ([#13](https://github.com/unjs/unimport/issues/13)) ([2cf781d](https://github.com/unjs/unimport/commit/2cf781d23cc1881c67e2c8c725bfabca2ffb7dba))

### [0.1.1](https://github.com/unjs/unimport/compare/v0.1.0...v0.1.1) (2022-03-19)


### Bug Fixes

* improve dection for object props ([736111a](https://github.com/unjs/unimport/commit/736111afcd468600e4c9250b500bb6cc65986ff2))

## [0.1.0](https://github.com/unjs/unimport/compare/v0.0.8...v0.1.0) (2022-03-15)


### ⚠ BREAKING CHANGES

* use options for `generateTypeDeclarations`

### Features

* `scanDirExports` utils, close [#9](https://github.com/unjs/unimport/issues/9) ([#10](https://github.com/unjs/unimport/issues/10)) ([e6f7c71](https://github.com/unjs/unimport/commit/e6f7c711c2f9f69f3390049b09637e7d28296be5))
* resolve priority from presets ([2353807](https://github.com/unjs/unimport/commit/2353807f8187cda87c99ad3184e0f1a332a9f9fa))
* use options for `generateTypeDeclarations` ([4c9c4dc](https://github.com/unjs/unimport/commit/4c9c4dc5dff3e76546dfd57785278cb3bfa099e3))


### Bug Fixes

* dts export {} ([0c7adb6](https://github.com/unjs/unimport/commit/0c7adb6dccb21b0ba063f43b24b94a5f63510d58))
* regexRE escaping ([61993e3](https://github.com/unjs/unimport/commit/61993e37f7223482b5a6c2159373a6f9c92a28e5))
* strip file extensions for exports ([#11](https://github.com/unjs/unimport/issues/11)) ([5e183a8](https://github.com/unjs/unimport/commit/5e183a8ca41fe79995de39a77f485818916d5df4))
* strip regex ([578d9b1](https://github.com/unjs/unimport/commit/578d9b138a1ef9ed0ecad95d5cb4e4bd0b71c119))

### [0.0.8](https://github.com/unjs/unimport/compare/v0.0.7...v0.0.8) (2022-03-09)


### Bug Fixes

* ship dts files ([7fe9a32](https://github.com/unjs/unimport/commit/7fe9a32c8063d922ad8cf6aa4d82ab4b85974e14))

### [0.0.7](https://github.com/unjs/unimport/compare/v0.0.6...v0.0.7) (2022-03-09)


### Bug Fixes

* types ([5fdc506](https://github.com/unjs/unimport/commit/5fdc50692d0c1ee1680f2fb9817a91430dc20a04))

### [0.0.6](https://github.com/unjs/unimport/compare/v0.0.5...v0.0.6) (2022-03-09)


### Bug Fixes

* types ([0b4364d](https://github.com/unjs/unimport/commit/0b4364dbf5a562064118257e437bb4a2a71a46f0))

### [0.0.5](https://github.com/unjs/unimport/compare/v0.0.4...v0.0.5) (2022-03-03)

### [0.0.4](https://github.com/unjs/unimport/compare/v0.0.3...v0.0.4) (2022-02-25)


### Features

* path resolver for dts generation ([14598a5](https://github.com/unjs/unimport/commit/14598a523cd3aba0044986b68d3e166ca0565d5e))

### [0.0.3](https://github.com/unjs/unimport/compare/v0.0.2...v0.0.3) (2022-02-25)


### Features

* `getImports` function ([84e6564](https://github.com/unjs/unimport/commit/84e6564a20e577b62ebd38609bbda98e2d49ffa9))
* `modifyDynamicImports` function ([8a15b6a](https://github.com/unjs/unimport/commit/8a15b6abebddd4b6f74e280b7960dddaa803f1fb))
* dynamic imports ([4964f9b](https://github.com/unjs/unimport/commit/4964f9b52c8a3c5a10f266c3b9740b02d6427ada))
* toExports ([b2baa8a](https://github.com/unjs/unimport/commit/b2baa8ac201c1210bc3ee17225955d96ae3b4f19))


### Bug Fixes

* clear internal map ([8232a44](https://github.com/unjs/unimport/commit/8232a44a97b0d05f7ea1c63c2f1c8008efabe3c0))
* **unplugin:** async transform support ([efc2a66](https://github.com/unjs/unimport/commit/efc2a6633590b27f1018146868cd8bffcb2da3ae))

### [0.0.2](https://github.com/unjs/unimport/compare/v0.0.1...v0.0.2) (2022-02-25)


### Bug Fixes

* expose utils ([0e74e2a](https://github.com/unjs/unimport/commit/0e74e2ac147af7aefa5c7bebeb4265b8d6da2f6b))

### 0.0.1 (2022-02-25)


### Features

* add built-in presets from unplugin-auto-import ([d3e5830](https://github.com/unjs/unimport/commit/d3e5830dce55e8918c18f7df36bde63326f7aab3))
* dts generation ([96b44b6](https://github.com/unjs/unimport/commit/96b44b66b476c8e7df44b73a199a08399e058a2d))
* imports priority and dedupe ([6036220](https://github.com/unjs/unimport/commit/60362205ce60030d7bf11228ef21000a2874531b))
* merging with an existing import declaration, close [#7](https://github.com/unjs/unimport/issues/7) ([b42ad88](https://github.com/unjs/unimport/commit/b42ad882a25a70f7524d0527c6950238e7560eb1))
* support default and import all syntax ([#3](https://github.com/unjs/unimport/issues/3)) ([2e7cf40](https://github.com/unjs/unimport/commit/2e7cf4093b6aac91fe2fe211fc16005cd8f6efa2))
* **unplugin:** `include` / `exclude` option ([5da4e16](https://github.com/unjs/unimport/commit/5da4e16e4fab719c5473bb6a00375aa3beffc769))
* **unplugin:** dts generation ([a03f6c7](https://github.com/unjs/unimport/commit/a03f6c75db526d26fc9d641099bde319170927b7))


### Bug Fixes

* **unplugin:** enfore `post` ([3edf518](https://github.com/unjs/unimport/commit/3edf5186653a7232c732c97ac89b101e48c2d89e))
