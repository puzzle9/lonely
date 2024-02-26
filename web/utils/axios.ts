import axios, { AxiosResponse, AxiosProgressEvent } from 'axios'
import signStore from '@/stores/sign.ts'
import naiveStore from '@/stores/naive.ts'

export const instance = axios.create({
  baseURL: '/api',
  timeout: 1000 * 30,
})

instance.interceptors.request.use(
  (config) => {
    naiveStore().loadingBar.start()

    let storeSign = signStore(),
      user_token = storeSign.user_token,
      authorization = `Bearer ${user_token}`

    if (!user_token) {
      let temp_uuid = storeSign.getTempUUID()
      storeSign.user_uuid = temp_uuid
      authorization = `${temp_uuid.split('-')[3]} ${temp_uuid}`
    }

    config.headers.Authorization = authorization
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    naiveStore().loadingBar.finish()
    return response.data
  },
  (error) => {
    console.error(error)
    naiveStore().loadingBar.error()
    let response = error.response
    switch (response?.status) {
      case 500:
        naiveStore().message.error('好像服务器有自己的想法了')
        break
      case 422:
        naiveStore().message.warning(response.data)
        break
    }

    return Promise.reject(response)
  },
)

export const storage = axios.create({
  baseURL: import.meta.env.PROD ? 'https://r2-storage.lonely.homes' : 'https://r2-storage-preview.lonely.homes',
  timeout: 1000 * 60,
  // https://stackoverflow.com/a/70839635/6686061
  validateStatus: (status: number) => (status >= 200 && status < 300) || status == 404,
  responseType: 'text',
})

export const uploadToStorage = (url: string, data: any, config = {}) =>
  new Promise((resolve, reject) => {
    // https://github.com/protobufjs/protobuf.js/issues/852
    axios
      .put(url, data, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        timeout: 1000 * 120,
        ...config,
      })
      .then(() => {
        resolve(null)
      })
      .catch((error) => {
        reject(error)
      })
  })

export type { AxiosProgressEvent }
