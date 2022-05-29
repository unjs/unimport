const z = `bar-${
  ref()
}-${fooConst}`
const withRegex = /`/
const secondLine = [$, ``]
const nestedSingleQuotes = `'${reactive()}'`
const nestedDoubleQuotes = `"${computed()}"`
const nestedTemplate = `prefix1${`prefix2${toRefs()}`}`
const multilineTemplate = `${useState(
)}`

const multilineNestedTemplateAndQuotes = `"'${useEffect(`'${
useRef(
)
}'`)}"'`
