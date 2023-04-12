import { computed } from 'vue'

const a = computed(() => /^(https?:\/\/|\/\/)/.test(props.to))
