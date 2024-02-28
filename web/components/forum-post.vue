<template>
  <div class="post">
    <n-thing content-indented>
      <template #avatar>
        <n-avatar
          round
          :size="30"
          :style="{
            color: uniqolor(post_form.body).color,
            backgroundColor: post_color,
          }">
          {{ storeSign.user_username || '匿' }}
        </n-avatar>
        <!-- 监听不到清除事件-->
        <n-color-picker
          v-model:value="post_color"
          class="color"
          :modes="['hex']"
          :swatches="Object.keys(color.ideas)"
          :actions="['confirm']"
          size="small"
          show-preview
          :disabled="post_submit_loading">
          <template #label></template>
        </n-color-picker>
      </template>
      <template #header>
        <n-mention
          type="textarea"
          v-model:value.trim="post_form.body"
          :disabled="post_submit_loading"
          :autosize="{
            minRows: 2,
            maxRows: 20,
          }"
          :options="mention_options"
          :loading="mention_loading"
          @search="mentionSearch"
          :placeholder="post_placeholder" />
      </template>

      <template #footer>
        <n-upload
          list-type="image"
          v-model:file-list="post_form.files"
          :max="9"
          :accept="post_upload_accept"
          :custom-request="fileStore().uploadFileRequest"
          @before-upload="postUploadBefore"
          multiple
          abstract>
          <div class="uploads">
            <div class="ability">
              <n-upload-trigger #="{ handleClick }" abstract>
                <n-button
                  v-for="post_upload_button in post_upload_buttons"
                  type="primary"
                  quaternary
                  circle
                  @click="post_upload_button.click(handleClick)"
                  :disabled="post_submit_loading">
                  <template #icon>
                    <n-icon size="20">
                      <component :is="post_upload_button.icon"></component>
                    </n-icon>
                  </template>
                </n-button>
              </n-upload-trigger>
            </div>

            <div class="submit">
              <n-tooltip trigger="hover" placement="bottom">
                <template #trigger>
                  <n-progress class="progress" type="circle" :show-indicator="false" status="success" :stroke-width="10" :percentage="(post_form.body.length / 200) * 100" />
                </template>
                已输入{{ post_form.body.length }}字
              </n-tooltip>

              <n-tooltip trigger="hover" :disabled="!post_submit_disable">
                <template #trigger>
                  <n-button type="primary" secondary round :loading="post_submit_loading" @click="postSubmit" :disabled="post_submit_disable">发布 </n-button>
                </template>
                说点什么再发布呀
              </n-tooltip>
            </div>
          </div>
          <div class="abilitys">
            <n-dynamic-input v-if="post_upload_button_type == 'link'" v-model:value="post_form.links" placeholder="支持https://开头的链接" :min="0" :max="3">
              <template #create-button-default>添加链接</template>
            </n-dynamic-input>

            <n-radio-group v-if="post_upload_button_type == 'visibility'" v-model:value="post_form.visibility" name="visibilitys">
              <n-space>
                <n-radio v-for="(visibility_value, visibility_type) in post_visibilitys" :key="visibility_value" :value="visibility_value" :label="visibility_type" />
              </n-space>
            </n-radio-group>
          </div>

          <n-upload-file-list />
        </n-upload>
      </template>
    </n-thing>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed, onBeforeMount } from 'vue'
  import { useStorage, watchDebounced } from '@vueuse/core'
  import { MentionOption, UploadFileInfo } from 'naive-ui'
  import uniqolor from 'uniqolor'
  import * as pb from '@protos/index'
  import signStore from '@/stores/sign.ts'
  import userStore from '@/stores/user.ts'
  import naiveStore from '@/stores/naive.ts'
  import forumStore from '@/stores/forum.ts'
  import fileStore, { fileImage, blobToUint8Array } from '@/stores/file.ts'
  import * as color from '@/utils/color.ts'

  const emits = defineEmits(['color', 'submit_success'])

  onBeforeMount(() => {
    postFormInit()
    emits('color', post_color.value)
  })

  const storeSign = signStore(),
    storeUser = userStore(),
    storeNaive = naiveStore(),
    storeForum = forumStore()

  import { ImageOutline, CompassOutline } from '@vicons/ionicons5'

  const mention_loading = ref(false),
    mention_options = ref<MentionOption[]>([]),
    mentionSearch = (value: string) => {
      mention_loading.value = true
      mention_options.value = []
      storeUser.searchUserByLocal(value).then((row) => {
        row.map((user) => {
          let username = user.username
          /**
           * todo: 不支持 包含搜索
           * https://github.com/tusen-ai/naive-ui/pull/5721
           */
          mention_options.value.push({
            label: `${user.nickname} ${username ? `@${username}` : ''}`,
            value: <string>(username || user.nickname),
          })
        })
        mention_loading.value = false
      })
    }

  const post_color = useStorage('post_color', color.COLOR_DEFAULT),
    // @ts-ignore
    post_placeholder = computed(() => color.getTipByColor(post_color.value)),
    post_visibilitys = {
      公开: pb.lonely.ForumInfo.ForumInfoVisibility.public,
      私密: pb.lonely.ForumInfo.ForumInfoVisibility.privacy,
    },
    post_form_default = {
      files: <UploadFileInfo[]>[],
      body: '',
      links: [],
      visibility: pb.lonely.ForumInfo.ForumInfoVisibility.public,
    },
    post_form = ref(),
    post_submit_loading = ref(false),
    post_submit_disable = computed(() => !!post_form.value.files.filter((row: UploadFileInfo) => row.status != 'finished').length || (!post_form.value.files.length && !post_form.value.body)),
    postCrab = () => {
      post_form.value = Object.assign({}, post_form_default, {
        body: post_color.value,
      })
      postSubmit()
    },
    postFormInit = () => {
      post_form.value = Object.assign({}, post_form_default)
    },
    postSubmit = async () => {
      post_submit_loading.value = true

      let post = post_form.value
      let files: pb.lonely.ForumInfo.Data.IFiles[] = [],
        thumbnail: Uint8Array[] = []
      for (let file of post.files) {
        files.push({
          type: pb.lonely.ForumInfo.Data.Files.Type.image,
          name: file.name,
          path: file.fullPath,
        })
        thumbnail.push(await blobToUint8Array(await fileImage.imageToWebp(<File>file.file, 0.3, 300, 300)))
      }

      post.links.forEach((link: string) => {
        files.push({
          type: pb.lonely.ForumInfo.Data.Files.Type.link,
          path: link,
        })
      })

      storeForum
        .forumPost({
          color: post_color.value,
          visibility: post.visibility,
          data: {
            body: post.body,
            thumbnail,
            files,
            allow_comment: false,
          },
        })
        .then(() => {
          storeNaive.message.success('发布成功')
          emits('submit_success')
          postFormInit()
        })
        .catch((err) => {
          console.error(err)
        })
        .finally(() => {
          post_submit_loading.value = false
        })
    }

  defineExpose({
    postCrab,
  })

  watchDebounced(
    post_color,
    () => {
      emits('color', post_color.value)
    },
    {
      debounce: 1000,
      maxWait: 5000,
    },
  )

  const post_upload_button_type = ref(),
    postUploadButtonTypeTrigger = (type: string) => {
      post_upload_button_type.value = post_upload_button_type.value != type ? type : null
    },
    post_upload_accept = ref()

  const post_upload_buttons = {
      image: {
        icon: ImageOutline,
        click: (fn: Function) => {
          post_upload_accept.value = 'image/*'
          // 刷新过快 dom 还没更新
          setTimeout(() => fn(), 0)
        },
      },
      link: {
        icon: CompassOutline,
        click: () => postUploadButtonTypeTrigger('link'),
      },
      // visibility: {
      //   icon: EyeOutline,
      //   click: () => postUploadButtonTypeTrigger('visibility'),
      // },
    },
    postUploadBefore = (options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
      let name = options.file.name
      if (options.fileList.filter((row) => row.name == name).length) {
        storeNaive.message.error(`存在同名文件 ${name}`)
        return false
      }
      return true
    }
</script>
<style scoped lang="stylus">
  .post
    .color
      height 18px

    :deep(.n-thing-header)
      display block

    .uploads
      display flex
      justify-content space-between

      .submit
        display flex
        align-items center

        .progress
          width 20px
          margin-right 10px

    .abilitys
      margin 10px 0
</style>
