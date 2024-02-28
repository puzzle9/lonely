<template>
  <div class="post_info">
    <n-thing content-indented>
      <template #avatar>
        <n-avatar
          round
          :size="30"
          :style="{
            backgroundColor: uniqolor(<string>info.data?.body).color,
          }">
          {{ info.author?.username || info.author?.nickname }}
        </n-avatar>
      </template>
      <template #header>
        <span v-if="info.author?.nickname">{{ info.author.nickname }}</span>
        <span v-if="info.author?.username"> @{{ info.author.username }}</span>
      </template>
      <template #header-extra>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-popconfirm @positive-click="deleteSubmit" :disabled="!(info.user_uuid == storeSign.user_uuid && unixCompareNow(info.created_at as string))">
              <template #trigger>
                {{ getUnixFormNow(info.created_at as string) }}
              </template>
              确认删除此贴
            </n-popconfirm>
          </template>
          {{ getUnixFormatDate(info.created_at as string, 'YY-MM-DD HH:mm') }}
        </n-tooltip>
      </template>
      <template #default v-if="info.data?.body">
        <n-scrollbar trigger="none" style="max-height: 30vh">
          {{ info.data.body }}
        </n-scrollbar>
      </template>
      <template #footer>
        <n-image-group>
          <Image v-for="(image, index) in images" :key="image.path" width="100" :image="info.data?.thumbnail?.[index]" :preview_url="<string>image.path" />
        </n-image-group>
        <div class="links">
          <n-button class="link" v-for="link in links" :key="link.path" text tag="a" :href="link.path" target="_blank" type="primary" block>
            <template #icon>
              <n-icon>
                <LinkOutline />
              </n-icon>
            </template>
            {{ link.path }}
          </n-button>
        </div>
      </template>
    </n-thing>
  </div>
</template>
<script setup lang="ts">
  import { ComputedRef } from 'vue'
  import { useArrayFilter } from '@vueuse/core'
  import uniqolor from 'uniqolor'
  import * as pb from '@protos/index'
  import signStore from '@/stores/sign.ts'
  import naiveStore from '@/stores/naive.ts'
  import forumStore from '@/stores/forum.ts'
  import { getUnixFormNow, getUnixFormatDate, unixCompareNow } from '@/utils/dayjs.ts'

  import { LinkOutline } from '@vicons/ionicons5'

  const emits = defineEmits(['delete_success'])

  const props = defineProps<{
    info: pb.lonely.IForumInfo
  }>()

  const links: ComputedRef<pb.lonely.ForumInfo.Data.IFiles[]> = useArrayFilter(
    <[]>props.info.data?.files,
    (file: pb.lonely.ForumInfo.Data.IFiles) => file.type == pb.lonely.ForumInfo.Data.Files.Type.link,
  )
  const images: ComputedRef<pb.lonely.ForumInfo.Data.IFiles[]> = useArrayFilter(
    <[]>props.info.data?.files,
    (file: pb.lonely.ForumInfo.Data.IFiles) => file.type == pb.lonely.ForumInfo.Data.Files.Type.image,
  )

  const storeSign = signStore(),
    storeNaive = naiveStore(),
    storeForum = forumStore()

  const deleteSubmit = () => {
    let ulid = <string>props.info.ulid
    storeForum.forumDelete(ulid).then(() => {
      storeNaive.message.success('删除成功')
      emits('delete_success', ulid)
    })
  }
</script>
<style scoped lang="stylus">
  .images
    .image
      margin-left 10px

  .links
    .link
      justify-content: flex-start
</style>
