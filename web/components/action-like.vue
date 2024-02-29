<template>
  <n-button text @click="likeTrigger" :loading="like_loading">
    <template #icon>
      <n-icon>
        <HeartSharp v-if="is_like" color="red" />
        <HeartOutline v-else />
      </n-icon>
    </template>
    {{ count_like }}
  </n-button>
</template>
<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import likeStore from '@/stores/like.ts'
  import { HeartSharp, HeartOutline } from '@vicons/ionicons5'
  import { TYPE_LIKE_TYPE } from '@common/like.ts'

  const props = defineProps<{
    type: TYPE_LIKE_TYPE
    related_id: string
    count_like?: number
  }>()

  onMounted(async () => {
    let info = await storeLike.likesInfo(props.type, props.related_id)
    if (info) {
      is_like.value = Boolean(info.is_like)
      count_like.value = count_like.value || Number(info.count_like)
    }
  })

  const storeLike = likeStore()

  const like_loading = ref(false),
    is_like = ref(false),
    count_like = ref(props.count_like || 0)

  const likeTrigger = () => {
    like_loading.value = true
    storeLike
      .likeTrigger(props.type, props.related_id)
      .then((res) => {
        is_like.value = res.is_like
        count_like.value = res.count_like
      })
      .finally(() => {
        like_loading.value = false
      })
  }
</script>
<style scoped lang="stylus"></style>
