// Regression test: mlly's regex parser incorrectly captures `async` from
// arrow function bodies as an export name. unimport should filter it out.
export const useSleep = () => useAsyncData('sleep', async () => { })
