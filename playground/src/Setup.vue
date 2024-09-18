<script setup lang="ts">
const count: Ref<number> = ref(1)

function inc() {
  count.value += 1
}
</script>

<template>
  <div v-focus-directive>
    <h1>{{ count }} x {{ multiplier }} = {{ count * multiplier }}</h1>
    <button v-custom-directive v-ripple-directive @click="inc">
      Inc
    </button>
    <button v-awesome-directive v-named-directive @click="bump">
      x1
    </button>
    <div v-named-mixed-directive v-mixed-directive>
      {{ nested() }}
    </div>
    <pre>{{ dummy }}</pre>
  </div>
</template>
