<template>
  <navbar ref="nav" title="帖子详情" show_back></navbar>
  <n-card :bordered="false">
    <n-spin v-if="forum_loading" />
    <template v-else>
      <forum-info v-if="forum_info.ulid" :info="forum_info" hide_block no_max_height></forum-info>
      <n-result v-else status="404" title="找不到此帖子">
        <template #footer>
          <n-button @click="nav.goBack()">返回看看</n-button>
        </template>
      </n-result>
    </template>
  </n-card>
</template>
<script setup lang="ts">
  import { Ref, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import * as pb from '@protos/index'
  import naiveStore from '@/stores/naive.ts'
  import forumStore from '@/stores/forum.ts'

  const nav = ref()

  const storeNaive = naiveStore(),
    storeForum = forumStore(),
    route = useRoute()

  const ulid = <string>route.params.ulid,
    forum_loading = ref(true),
    forum_info: Ref<pb.lonely.IForumInfo> = ref({})

  const getInfo = () => {
    storeForum
      .forumInfo(ulid)
      .then((res) => {
        forum_info.value = res
      })
      .catch(() => {
        storeNaive.message.error('找不到了')
      })
      .finally(() => {
        forum_loading.value = false
      })
  }

  getInfo()
</script>
<style scoped lang="stylus"></style>
