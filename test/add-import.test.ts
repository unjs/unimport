import { test, expect, describe } from 'vitest'
import { Import } from '../src/types'
import { addImportToCode } from '../src/utils'

describe('add-import', () => {
  const code = `
import { foo } from 'specifier1'
import { bar } from 'specifier1'
import defaultFoo from 'specifier2'
import{compact}from'specifier3'
import * as importAll from 'specifier4'
import { } from 'specifier5'
`
  const imports: Import[] = [
    { name: 'import1', from: 'specifier1' },
    { name: 'import2', from: 'specifier2' },
    { name: 'import3', from: 'specifier3' },
    { name: 'import4', from: 'specifier4' },
    { name: 'foo', as: 'import5', from: 'specifier5' },
    { name: 'import10', from: 'specifier10' }
  ]

  test('no merge', () => {
    expect(addImportToCode(code, imports, false, false).code)
      .toMatchInlineSnapshot(`
        "import { import1 } from 'specifier1';
        import { import2 } from 'specifier2';
        import { import3 } from 'specifier3';
        import { import4 } from 'specifier4';
        import { foo as import5 } from 'specifier5';
        import { import10 } from 'specifier10';

        import { foo } from 'specifier1'
        import { bar } from 'specifier1'
        import defaultFoo from 'specifier2'
        import{compact}from'specifier3'
        import * as importAll from 'specifier4'
        import { } from 'specifier5'
        "
      `)
  })

  test('merge existing', () => {
    expect(addImportToCode(code, imports, false, true).code)
      .toMatchInlineSnapshot(`
        "import { import2 } from 'specifier2';
        import { import4 } from 'specifier4';
        import { import10 } from 'specifier10';

        import { import1, foo } from 'specifier1'
        import { bar } from 'specifier1'
        import defaultFoo from 'specifier2'
        import{ import3,compact}from'specifier3'
        import * as importAll from 'specifier4'
        import { foo as import5, } from 'specifier5'
        "
      `)
  })
})

describe('add-import with comment', () => {
  const code = `
import { foo } from 'specifier1'
// import { foo2 } from 'specifier1'
import { bar } from 'specifier1'
import defaultFoo from 'specifier2'
import{compact}from'specifier3'
/**
* import { foo3 } from './foo'
*/
import * as importAll from 'specifier4'
import { } from 'specifier5'
`
  const imports: Import[] = [
    { name: 'import1', from: 'specifier1' },
    { name: 'import2', from: 'specifier2' },
    { name: 'import3', from: 'specifier3' },
    { name: 'import4', from: 'specifier4' },
    { name: 'foo', as: 'import5', from: 'specifier5' },
    { name: 'import10', from: 'specifier10' }
  ]

  test('no merge', () => {
    expect(addImportToCode(code, imports, false, false).code)
      .toMatchInlineSnapshot(`
        "import { import1 } from 'specifier1';
        import { import2 } from 'specifier2';
        import { import3 } from 'specifier3';
        import { import4 } from 'specifier4';
        import { foo as import5 } from 'specifier5';
        import { import10 } from 'specifier10';

        import { foo } from 'specifier1'
        // import { foo2 } from 'specifier1'
        import { bar } from 'specifier1'
        import defaultFoo from 'specifier2'
        import{compact}from'specifier3'
        /**
        * import { foo3 } from './foo'
        */
        import * as importAll from 'specifier4'
        import { } from 'specifier5'
        "
      `)
  })

  test('merge existing', () => {
    expect(addImportToCode(code, imports, false, true).code)
      .toMatchInlineSnapshot(`
        "import { import2 } from 'specifier2';
        import { import4 } from 'specifier4';
        import { import10 } from 'specifier10';

        import { import1, foo } from 'specifier1'
        // import { foo2 } from 'specifier1'
        import { bar } from 'specifier1'
        import defaultFoo from 'specifier2'
        import{ import3,compact}from'specifier3'
        /**
        * import { foo3 } from './foo'
        */
        import * as importAll from 'specifier4'
        import { foo as import5, } from 'specifier5'
        "
      `)
  })

  test('merge existing and injection at end', () => {
    expect(addImportToCode(code, imports, false, true, true).code)
      .toMatchInlineSnapshot(`
        "
        import { import1, foo } from 'specifier1'
        // import { foo2 } from 'specifier1'
        import { bar } from 'specifier1'
        import defaultFoo from 'specifier2'
        import{ import3,compact}from'specifier3'
        /**
        * import { foo3 } from './foo'
        */
        import * as importAll from 'specifier4'
        import { foo as import5, } from 'specifier5'

        import { import2 } from 'specifier2';
        import { import4 } from 'specifier4';
        import { import10 } from 'specifier10';
        "
      `)
  })
})
