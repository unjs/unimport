import { ref, computed } from 'vue';
// Regression: a declaration inside a nested block (function body, plain
// block, ...) must only shadow references inside that block. It used to be
// excluded module-wide, which stripped the auto-imported `ref` below.
// See: https://github.com/unjs/unimport/issues/520

const v = ref()

function foo() {
  const ref = JSON.parse("{}")
  return ref
}

function bar() {
  {
    const computed = 1
    return computed
  }
}

const w = computed()
