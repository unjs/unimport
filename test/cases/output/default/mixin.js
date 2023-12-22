import { Mixin } from './Mixin';
export const TestMixin = {
  mixins: [Mixin],
  watch: {
    myValue(to, from) {}
  }
}
