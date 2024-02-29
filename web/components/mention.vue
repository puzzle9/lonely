<template>
  <n-mention
    type="textarea"
    v-model:value="value as any"
    :autosize="{
      minRows: props.min,
      maxRows: props.max,
    }"
    :options="options"
    :loading="loading"
    @search="search"
    :placeholder="placeholder"
    :disabled="props.disabled" />
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { MentionOption } from 'naive-ui'
  import userStore from '@/stores/user.ts'

  const props = defineProps<{
    value: string
    min: number
    max: number
    placeholder: string
    disabled?: boolean
  }>()

  const value = defineModel('value', { required: true })

  const storeUser = userStore()

  const loading = ref(false),
    options = ref<MentionOption[]>([]),
    search = (value: string) => {
      loading.value = true
      options.value = []
      storeUser.searchUserByLocal(value).then((row) => {
        row.map((user) => {
          let username = user.username
          /**
           * todo: 不支持 包含搜索
           * https://github.com/tusen-ai/naive-ui/pull/5721
           */
          options.value.push({
            label: `${user.nickname} ${username ? `@${username}` : ''}`,
            value: <string>(username || user.nickname),
          })
        })
        loading.value = false
      })
    }
</script>
<style scoped lang="stylus"></style>
