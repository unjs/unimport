import { ref } from 'vue';
// https://github.com/antfu/unplugin-auto-import/issues/220
const value = 1 / 1 + ref().val / 1
console.log(value)
