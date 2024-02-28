<template>
  <div v-if="storeNaive.is_mobile">
    <n-drawer :show="drawer_show" placement="left" @mask-click="drawer_show = false">
      <n-drawer-content body-content-class="drawer">
        <menus />
      </n-drawer-content>
    </n-drawer>
  </div>
  <n-layout-header bordered>
    <n-card :bordered="false" size="small">
      <template #header>
        <div class="navbar">
          <n-button v-if="storeNaive.is_mobile && !show_back" quaternary circle @click="drawer_show = true">
            <template #icon>
              <n-icon>
                <dehaze-round />
              </n-icon>
            </template>
          </n-button>
          <n-button class="back-btn" v-if="show_back" quaternary circle @click="goBack">
            <template #icon>
              <n-icon>
                <chevron-left-round />
              </n-icon>
            </template>
          </n-button>

          {{ props.title }}

          <n-switch :value="storeNaive.theme_name === 'dark'" @update:value="storeNaive.triggerTheme()">
            <template #checked-icon>
              <n-icon>
                <DarkModeOutlined />
              </n-icon>
            </template>
            <template #unchecked-icon>
              <n-icon>
                <LightModeOutlined />
              </n-icon>
            </template>
          </n-switch>
        </div>
      </template>
    </n-card>
  </n-layout-header>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import naiveStore from '@/stores/naive.ts'
  import { LightModeOutlined, DarkModeOutlined, ChevronLeftRound, DehazeRound } from '@vicons/material'

  const storeNaive = naiveStore(),
    router = useRouter()

  const props = defineProps({
    show_back: {
      type: Boolean,
      default: false,
    },
    title: String,
  })

  const drawer_show = ref(false)

  const goBack = () => {
    if (router.options.history.state.position == 1) {
      router.push({
        name: 'Index',
      })
    } else {
      router.go(-1)
    }
  }

  defineExpose({
    goBack,
  })
</script>
<style scoped lang="stylus">
  :deep(.n-scrollbar-container .drawer)
    height 100%

  .navbar
    display flex
    align-items center
    justify-content space-between
</style>
