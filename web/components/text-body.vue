<template>
  <div class="text">
    {{ props.body }}
  </div>
</template>
<script setup lang="ts">
  const props = defineProps({
    body: String,
  })
</script>
<style scoped lang="stylus">
  .text
    white-space pre-line
    word-break break-all
</style>
