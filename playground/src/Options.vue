<script lang="ts">
export default defineComponent({
  setup() {
    const multiplier = ref(100)
    const count = ref(5)

    return {
      multiplier,
      count,
      inc() {
        count.value += 1
      },
      bump() {
        multiplier.value += 1
      },
      nested() {
        return 'from setup, this should not be overridden'
      },
    }
  },
})
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
  </div>
</template>
