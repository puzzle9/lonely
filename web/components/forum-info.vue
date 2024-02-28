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
        <n-flex justify="end">
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
          <n-popconfirm v-if="COLOR_DARK_ROOM != info.color" @positive-click="blockSubmit" :show-icon="false" trigger="hover">
            <template #trigger>
              <n-button text>
                <template #icon>
                  <n-icon>
                    <ReportOutlined />
                  </n-icon>
                </template>
              </n-button>
            </template>
            屏蔽此帖
          </n-popconfirm>
        </n-flex>
      </template>
      <template #action>
        <n-flex justify="end"></n-flex>
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
  import { ComputedRef, computed } from 'vue'
  import { useArrayFilter } from '@vueuse/core'
  import uniqolor from 'uniqolor'
  import * as pb from '@protos/index'
  import signStore from '@/stores/sign.ts'
  import naiveStore from '@/stores/naive.ts'
  import forumStore from '@/stores/forum.ts'
  import { COLOR_DARK_ROOM } from '@common/colors.ts'
  import { getUnixFormNow, getUnixFormatDate, unixCompareNow } from '@/utils/dayjs.ts'

  import { LinkOutline } from '@vicons/ionicons5'
  import { ReportOutlined } from '@vicons/material'

  const emits = defineEmits(['delete_success', 'black_success'])

  const props = defineProps<{
    info: pb.lonely.IForumInfo
  }>()

  const forum_ulid: ComputedRef<string> = computed(() => <string>props.info.ulid)

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
    let ulid = forum_ulid.value
    storeForum.forumDelete(ulid).then(() => {
      storeNaive.message.success('删除成功')
      emits('delete_success', ulid)
    })
  }

  const blockSubmit = () => {
    let ulid = forum_ulid.value
    storeForum.forumBlock(ulid).then(() => {
      storeNaive.message.success('屏蔽成功 已将此帖关进小黑屋')
      emits('black_success', ulid)
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
