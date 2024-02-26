<template></template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import naiveStore from '@/stores/naive.ts'
  import userStore from '@/stores/user.ts'

  const storeNaive = naiveStore(),
    storeUser = userStore(),
    router = useRouter(),
    route = useRoute()
</script>
<style scoped lang="stylus"></style>
