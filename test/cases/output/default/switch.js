import { Foo, Bar } from 'foobar';
function foo(mode) {
  switch (mode) {
    case Foo:
      return '1'
    case Bar + 1:
      return '2'
  }
}
