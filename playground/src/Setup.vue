<script setup lang="ts">
const count: Ref<number> = ref(1)

function inc () {
  count.value += 1
}
</script>

<template>
  <div>
    <h1>{{ count }} x {{ multiplier }} = {{ count * multiplier }}</h1>
    <button @click="inc">
      Inc
    </button>
    <button @click="bump">
      x1
    </button>
    <div>
      {{ nested() }}
    </div>
  </div>
</template>
