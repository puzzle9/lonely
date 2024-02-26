<template>
  <n-config-provider :theme="storeNaive.getTheme" :locale="zhCN" :date-locale="dateZhCN">
    <Sign />
    <RouteView />
  </n-config-provider>
</template>

<script setup lang="ts">
  import { zhCN, dateZhCN } from 'naive-ui'
  import naiveStore from '@/stores/naive.ts'

  const storeNaive = naiveStore()
</script>

<style scoped lang="stylus"></style>
