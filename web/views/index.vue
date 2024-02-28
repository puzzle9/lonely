<template>
  <n-layout class="Index" content-class="layout" :has-sider="!is_mobile" :position="is_mobile ? 'static' : 'absolute'">
    <n-layout-sider
      v-if="!is_mobile"
      width="200px"
      class="sider"
      content-class="content"
      :native-scrollbar="false"
      collapse-mode="width"
      :collapsed-width="64"
      :collapsed="layout_collapsed"
      bordered>
      <menus :layout_collapsed="layout_collapsed"></menus>
    </n-layout-sider>
    <n-layout class="content" :native-scrollbar="false">
      <n-layout-content>
        <RouteView />
      </n-layout-content>
      <n-back-top :right="`${is_tablet ? 'calc(10px)' : 'calc(50% - 410px)'}`" v-if="!is_mobile" />
    </n-layout>

    <n-layout
      :style="{
        'max-width': is_tablet ? '42px' : '200px',
      }"
      v-if="!is_mobile"
      has-sider
      sider-placement="right">
      <n-layout-sider bordered></n-layout-sider>
    </n-layout>
  </n-layout>
  <n-back-top v-if="is_mobile" />
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import naiveStore from '@/stores/naive.ts'

  const storeNaive = naiveStore()

  const { is_mobile, is_tablet } = storeToRefs(storeNaive)
  // todo: 暂不适配平板
  const layout_collapsed = computed(() => false && is_tablet.value)
</script>
<style scoped lang="stylus">
  // 内容宽度
  content_width = 700px

  .Index
    :deep(.layout)
      justify-content center

    .sider
      :deep(.content)
        display flex
        flex-direction column
        justify-content space-between
        height 100%

      .sign
        .icon
          margin 10px

        .buttons
          margin 30px
          display flex
          justify-content space-between

    .content
      max-width content_width
</style>

<style lang="stylus">
  .n-back-top
    z-index 10
</style>
