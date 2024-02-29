<template>
  <n-list hoverable clickable>
    <n-list-item>
      <n-thing content-indented>
        <template #avatar>
          <n-avatar
            round
            :size="30"
            :style="{
              color: uniqolor(comment_form.body).color,
            }">
            {{ storeSign.user_username || '匿' }}
          </n-avatar>
        </template>
        <template #default>
          <mention :min="1" :max="10" :placeholder="getCommentTip()" v-model:value="comment_form.body" />
        </template>
        <template #footer>
          <div class="submit" v-show="comment_form.body.length">
            <n-tooltip trigger="hover" placement="bottom">
              <template #trigger>
                <n-progress class="progress" type="circle" :show-indicator="false" status="success" :stroke-width="10" :percentage="(comment_form.body.length / 200) * 100" />
              </template>
              已输入{{ comment_form.body.length }}字
            </n-tooltip>

            <n-button type="primary" secondary round :loading="comment_submit_loading" @click="commentSubmit">发布 </n-button>
          </div>
        </template>
      </n-thing>
    </n-list-item>
    <n-list-item v-for="list in lists" :key="list.ulid">
      <n-thing content-indented>
        <template #avatar>
          <n-avatar
            round
            :size="30"
            :style="{
              backgroundColor: uniqolor(<string>list.data?.body).color,
            }">
            {{ list.data?.author?.username || list.data?.author?.nickname }}
          </n-avatar>
        </template>
        <template #header>
          <span v-if="list.data?.author?.username">@{{ list.data.author.username }}</span>
          <span v-else>{{ list.data?.author?.nickname }}</span>
        </template>
        <template #header-extra>
          <n-flex justify="end" style="align-items: center">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-popconfirm @positive-click="deleteSubmit(<string>list.ulid)" :disabled="!(list.user_uuid == storeSign.user_uuid && unixCompareNow(list.created_at as string))">
                  <template #trigger>
                    {{ getUnixFormNow(list.created_at as string) }}
                  </template>
                  将删除此评论
                </n-popconfirm>
              </template>
              {{ getUnixFormatDate(list.created_at as string, 'YY-MM-DD HH:mm') }}
            </n-tooltip>
            <action-like :type="LIKE_TYPE.forum_comment" :related_id="<string>list.ulid" :count_like="Number(list.count_like)" />
          </n-flex>
        </template>
        <template #default>
          {{ list.data?.body }}
        </template>
      </n-thing>
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
          <n-button text @click="retry"> 加载出错 点击重试</n-button>
        </n-divider>
      </template>
      <template #no-results> 恩,还没得评论，空的！！！</template>
    </VueEternalLoading>
  </n-list>
</template>
<script setup lang="ts">
  import { ref, Ref } from 'vue'
  import uniqolor from 'uniqolor'
  import * as pb from '@protos/index'
  import commentStore from '@/stores/comment.ts'
  import { TYPE_COMMENT_TYPE } from '@common/comment.ts'
  import { getUnixFormNow, getUnixFormatDate, unixCompareNow } from '@/utils/dayjs.ts'
  import signStore from '@/stores/sign.ts'
  import naiveStore from '@/stores/naive.ts'
  import { getCommentTip } from '@/utils/tips.ts'
  import { COMMENT_PAGE_SIZE } from '@common/comment.ts'
  import { LIKE_TYPE } from '@common/like.ts'
  // @ts-ignore
  import { VueEternalLoading, LoadAction } from '@ts-pro/vue-eternal-loading'

  const props = defineProps<{
    type: TYPE_COMMENT_TYPE
    related_id: string
  }>()

  // fixme: 不优雅 层级容易乱
  const emits = defineEmits(['count_comment'])

  const storeSign = signStore(),
    storeNaive = naiveStore()

  const storeComment = commentStore()

  const comment_form = ref({
      body: '',
    }),
    comment_submit_loading = ref(false),
    commentSubmit = () => {
      let body = comment_form.value.body

      comment_submit_loading.value = true

      storeComment
        .commentSubmit({
          type: props.type as any,
          related_id: props.related_id,
          data: {
            body,
          },
        })
        .then((res) => {
          emits('count_comment', res.count_comment)
          storeNaive.message.success('评论成功')
          comment_form.value.body = ''
          if (lists.value.length) {
            getList('before')
          } else {
            list_load_initial.value = true
          }
        })
        .finally(() => {
          comment_submit_loading.value = false
        })

      console.log(body)
    }

  const lists: Ref<pb.lonely.IComment[]> = ref([]),
    getList = (type: 'after' | 'before' = 'after') => {
      return new Promise((resolve, reject) => {
        storeComment
          .commentLists(props.type, props.related_id, type, lists.value.at(type == 'after' ? -1 : 0)?.ulid || '')
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
          let res_length = res.length
          if (res_length) {
            if (res_length != COMMENT_PAGE_SIZE) {
              load.noMore()
            } else {
              load.loaded()
            }
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

  const deleteSubmit = (ulid: string) => {
    storeComment.commentDelete(ulid, props.type, props.related_id).then((res) => {
      emits('count_comment', res.count_comment)
      storeNaive.message.success('删除成功')
      lists.value = lists.value.filter((list) => list.ulid != ulid)
      if (!lists.value.length) {
        list_load_initial.value = true
      }
    })
  }
</script>
<style scoped lang="stylus">
  .submit
    display flex
    align-items center
    justify-content end

    .progress
      width 20px
      margin-right 10px
</style>
