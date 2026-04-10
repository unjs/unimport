// Regression: for (const [a, b] of ...) should not cause subsequent
// var declarations to be missed by the exclude scanner.
// See: https://github.com/unjs/unimport/issues/521

for (const [index, browserCode] of Object.entries(browsers)) {
  const lang = browserCode.split("-")[0].toLowerCase()
}

var ref = localCreateRef()

const items = [
  { meta: [] }
]

ref(items)
