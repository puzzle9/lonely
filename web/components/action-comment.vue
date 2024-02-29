<template>
  <n-button text @click="commentShow" :disabled="props.disabled">
    <template #icon>
      <n-icon>
        <ChatboxOutline />
      </n-icon>
    </template>
    {{ count_comment }}
  </n-button>
  <n-modal v-model:show="comment_show" display-directive="show" preset="card" title="评论" size="huge" :bordered="false" style="width: 95%; max-width: 650px; height: 65vh">
    <n-scrollbar
      trigger="none"
      :style="{
        'max-height': '50vh',
      }">
      <comment-list :type="props.type" :related_id="props.related_id" @count_comment="updateCountComment" />
    </n-scrollbar>
  </n-modal>
</template>
<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import commentStore from '@/stores/comment.ts'
  import { ChatboxOutline } from '@vicons/ionicons5'
  import { TYPE_COMMENT_TYPE } from '@common/comment.ts'

  const props = defineProps<{
    type: TYPE_COMMENT_TYPE
    related_id: string
    count_comment?: number
    disabled?: boolean
    disable_modal?: boolean
  }>()

  onMounted(async () => {
    let info = await storeComment.commentsInfo(props.type, props.related_id)
    if (info) {
      count_comment.value = count_comment.value || Number(info.count_like)
    }
  })

  const storeComment = commentStore()

  const comment_show = ref(false),
    count_comment = ref(props.count_comment)

  const commentShow = () => {
      if (!props.disable_modal) {
        comment_show.value = true
      }
    },
    updateCountComment = (value: number) => {
      count_comment.value = value
    }
</script>
<style scoped lang="stylus"></style>
