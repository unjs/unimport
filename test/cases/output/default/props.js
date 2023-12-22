import { toRefs } from 'vue';
const a = z.ref(0)
console.log({
  ...toRefs(a)
})
