<template>
  <navbar title="帖子列表"></navbar>
  <n-list hoverable clickable>
    <n-list-item>
      <forum-post ref="forum_post" @color="postChangeColor" @submit_success="postSubmitSuccess" />
    </n-list-item>
    <n-list-item v-for="list in lists" :key="list.ulid">
      <forum-info @delete_success="postListDelete" :info="list"></forum-info>
    </n-list-item>
    <VueEternalLoading :load="listLoad" v-model:is-initial="list_load_initial" style="margin-top: 10px">
      <template #loading>
        <div style="text-align: center; height: 50px">
          <n-spin />
        </div>
      </template>
      <template #no-more>
        <span></span>
      </template>
      <template #error="{ retry }">
        <n-divider dashed title-placement="left">
          <n-button text @click="retry"> 好像出错了 点击重试</n-button>
        </n-divider>
      </template>
      <template #no-results>
        <n-result status="404" title="这是个新节点" description="要不 整点啥子">
          <template #footer>
            <n-button quaternary @click="forum_post.postCrab()">来个螃蟹</n-button>
          </template>
        </n-result>
      </template>
    </VueEternalLoading>
  </n-list>
</template>
<script setup lang="ts">
  import { Ref, ref } from 'vue'
  import * as pb from '@protos/index'
  import forumStore from '@/stores/forum.ts'
  import ForumPost from '@/components/forum-post.vue'
  // @ts-ignore
  import { VueEternalLoading, LoadAction } from '@ts-pro/vue-eternal-loading'

  const storeForum = forumStore()

  const forum_post = ref()

  const post_color = ref(),
    lists: Ref<pb.lonely.IForumInfo[]> = ref([]),
    getList = (type: 'after' | 'before' = 'after') => {
      return new Promise((resolve, reject) => {
        storeForum
          .forumLists(type, lists.value.at(type == 'after' ? -1 : 0)?.ulid || '', post_color.value)
          .then((res) => {
            res.forEach((row) => {
              lists.value[type == 'after' ? 'push' : 'unshift'](row)
            })
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    list_load_initial = ref(true),
    listLoad = (load: LoadAction) => {
      getList('after')
        // @ts-ignore
        .then((res: []) => {
          if (res.length) {
            load.loaded()
          } else {
            if (lists.value.length) {
              load.noMore()
            } else {
              load.noResults()
            }
          }
        })
        .catch(() => {
          load.error()
        })
    }

  const postChangeColor = (value: string) => {
      post_color.value = value
      lists.value = []
      list_load_initial.value = true
    },
    postListDelete = (ulid: string) => {
      lists.value = lists.value.filter((list) => list.ulid != ulid)
      if (!lists.value.length) {
        list_load_initial.value = true
      }
    },
    postSubmitSuccess = () => {
      // todo: 有一种可能 发的比较多 第一次未加载到自己
      getList('before')
      // list_load_initial.value = true
    }
</script>
<style scoped lang="stylus"></style>
