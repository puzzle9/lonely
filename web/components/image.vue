<template>
  <n-image ref="img" :width="width" :src="image_src" :preview-src="image_preview_src" @load="load" preview-disabled />
</template>
<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  const props = defineProps({
    width: {
      type: [Number, String],
      default: 100,
    },
    image: {
      types: [String, Uint8Array],
      required: false,
    },
    /**
     * fixme: 预览功能暂未想到如何实现
     * 图片采用aes加密
     * 这个大图预览 暂不晓得如何加进去
     */
    preview_url: {
      type: String,
      required: false,
    },
  })

  const img = ref()

  onMounted(() => {
    let image = props.image
    if (image instanceof Uint8Array) {
      image_src.value = URL.createObjectURL(new Blob([image]))
    }
  })

  const image_src = ref(),
    image_preview_src = ref()

  const load = () => {
    let src = img.value.src
    if (src.startsWith('blob')) {
      URL.revokeObjectURL(src)
    }
  }
</script>
<style scoped lang="stylus"></style>
