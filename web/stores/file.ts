import { defineStore } from 'pinia'
import { instance, uploadToStorage, AxiosProgressEvent } from '@/utils/axios.ts'
import * as crypto from '@/utils/crypto.ts'
import { UploadCustomRequestOptions } from 'naive-ui'
import naiveStore from '@/stores/naive.ts'
import * as image from '@/utils/image.ts'

export { image as fileImage }

export async function blobToUint8Array(data: Blob) {
  return new Uint8Array(await data.arrayBuffer())
}

export default defineStore(
  'file',
  () => {
    const uploadFileRequest = async (options: UploadCustomRequestOptions) => {
      let progress = (percent: number) =>
          options.onProgress({
            percent,
          }),
        error = (message: string) => {
          naiveStore().message.error(message)
          options.onError()
        }

      progress(1)

      let file = <File>options.file.file,
        file_type = null,
        file_data: Blob | void = file

      if (image.fileIsImage(file)) {
        file_type = 'image'
        file_data = await image.imageToWebp(<File>options.file.file).catch((err) => {
          console.error(err)
          error('暂不支持此浏览器或图片')
        })
        if (!file_data) {
          return
        }
        options.file.thumbnailUrl = URL.createObjectURL(file_data)
        progress(10)
      }

      let file_upload_data: {
          upload_url: string
          path: string
        } = await instance
          .get('/file/token', {
            params: {
              type: file_type,
            },
          })
          .catch((err) => {
            error('好像哪里出错了 要不再试下')
            return err
          }),
        file_upload_url = file_upload_data.upload_url,
        file_upload_path = file_upload_data.path
      if (!file_upload_url) {
        return
      }
      progress(20)

      await uploadToStorage(file_upload_url, await crypto.encodeData(await blobToUint8Array(file_data), file_upload_path), {
        onUploadProgress: (event: AxiosProgressEvent) => {
          progress(Math.round((Number(event.progress) * 100) / 2 + 50))
        },
      })

      options.file.fullPath = file_upload_path
      options.onFinish()
    }

    return {
      uploadFileRequest,
    }
  },
  {
    // persist: true,
  },
)
