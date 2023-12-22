import { ref } from 'vue';
const modules = import.meta.glob("/src/nested/*.vue");
const msg = ref("Global Imports");
