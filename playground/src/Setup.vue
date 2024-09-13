<script setup lang="ts">
const count: Ref<number> = ref(1)

function inc() {
  count.value += 1
}
</script>

<template>
  <div>
    <h1>{{ count }} x {{ multiplier }} = {{ count * multiplier }}</h1>
    <button v-custom-directive @click="inc">
      Inc
    </button>
    <button v-awesome-directive @click="bump">
      x1
    </button>
    <div v-named-mixed-directive v-default-mixed-directive>
      {{ nested() }}
    </div>
  </div>
</template>
