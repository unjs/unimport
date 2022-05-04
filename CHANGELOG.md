# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

* use options for `generateTypeDecarations`

### Features

* `scanDirExports` utils, close [#9](https://github.com/unjs/unimport/issues/9) ([#10](https://github.com/unjs/unimport/issues/10)) ([e6f7c71](https://github.com/unjs/unimport/commit/e6f7c711c2f9f69f3390049b09637e7d28296be5))
* resolve priority from presets ([2353807](https://github.com/unjs/unimport/commit/2353807f8187cda87c99ad3184e0f1a332a9f9fa))
* use options for `generateTypeDecarations` ([4c9c4dc](https://github.com/unjs/unimport/commit/4c9c4dc5dff3e76546dfd57785278cb3bfa099e3))


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
