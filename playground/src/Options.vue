<script lang="ts">
export default defineComponent({
  setup () {
    const multiplier = ref(100)
    const count = ref(5)

    return {
      multiplier,
      count,
      inc () {
        count.value += 1
      },
      bump () {
        multiplier.value += 1
      },
      nested () {
        return 'from setup, this should not be overridden'
      }
    }
  }
})
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
