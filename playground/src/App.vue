<script setup lang="ts">
const count = ref(1)

function inc () {
  count.value += 1
}
</script>

<template>
  <div>
    <h1>{{ count }}</h1>
    <button @click="inc">
      Inc
    </button>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
