<template>
  <div class="menus">
    <n-menu
      :value="layout_menu"
      :options="layout_menus"
      :accordion="true"
      :collapsed="layout_collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      @update-value="layoutMenuUpdate" />
    <div class="sign">
      <template v-if="storeSign.user_token">
        <n-thing class="in">
          <template #avatar>
            <n-avatar round>
              {{ storeSign.user_username }}
            </n-avatar>
          </template>

          <template #header> @{{ storeSign.user_username }}</template>

          <template #header-extra>
            <n-popconfirm @positive-click="storeSign.signOut()">
              <template #trigger>
                <n-button quaternary circle>
                  <template #icon>
                    <n-icon>
                      <log-out-outline />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              确认退出登录?
            </n-popconfirm>
          </template>
        </n-thing>
      </template>
      <template v-else>
        <!--todo:animation-->
        <div class="icon" v-show="layout_collapsed">
          <n-icon size="40">
            <LogIn />
          </n-icon>
        </div>
        <div class="buttons" v-show="!layout_collapsed">
          <n-button strong secondary round type="primary" @click="storeSign.showIn">登录</n-button>
          <n-button strong secondary round type="info" @click="storeSign.showReg">注册</n-button>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, h } from 'vue'
  import { MenuOption } from 'naive-ui'
  import { useRoute, useRouter } from 'vue-router'
  import signStore from '@/stores/sign.ts'

  defineProps({
    layout_collapsed: Boolean,
  })

  const storeSign = signStore(),
    router = useRouter(),
    route = useRoute()

  import { HomeOutline, LogIn, LogOutOutline } from '@vicons/ionicons5'

  const layout_menu_default = 'ForumList',
    layout_menu = ref(route.name as string || layout_menu_default),
    layout_menus: MenuOption[] = [
      {
        label: '主页',
        icon: () => h(HomeOutline),
        key: layout_menu_default,
      },
      // {
      //   label: '消息',
      //   icon: () => h(ChatbubblesOutline),
      //   key: 'Message',
      // },
      // {
      //   label: '设置',
      //   icon: () => h(SettingsOutline),
      //   key: 'Setting',
      // },
    ],
    layoutMenuUpdate = (name: string) => {
      router.push({
        name,
      })
    }
</script>
<style scoped lang="stylus">
  .menus
    display flex
    flex-direction column
    justify-content space-between
    height 100%

    .sign
      .in
        margin 10px

      .icon
        margin 10px

      .buttons
        margin 30px
        display flex
        justify-content space-between
</style>
