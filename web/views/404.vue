<template>
  <n-result class="notFound" status="404" title="404 资源不存在" description="去其他地方看看吧">
    <template #footer>
      <n-button @click="goIndex">回主页</n-button>
    </template>
  </n-result>
</template>
<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const goIndex = () =>
    router.push({
      name: 'Index',
    })
</script>
<style scoped lang="stylus">
  .notFound
    margin-top 20%
</style>
