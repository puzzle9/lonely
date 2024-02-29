import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as pb from '@protos/index'
import { instance, storage, uploadToStorage } from '@/utils/axios.ts'
import { getUnix } from '@/utils/dayjs.ts'
import db, * as dbType from '@/utils/db.ts'
import * as commonPath from '@common/path.ts'

type USER_UPLOAD_TOKEN_TYPE = 'info' | 'forum'

export default defineStore(
  'user',
  () => {
    const user_info_url = ref()

    const getUserPublic = (uuid: string): Promise<string | null> =>
      new Promise(async (resolve, reject) => {
        let info = await db.getUserInfo(uuid),
          public_key = info?.public_key
        if (public_key) {
          return resolve(public_key)
        }

        let res = await storage.get(commonPath.getUserPublicPath(uuid)),
          status = res.status
        if (status == 404) {
          let error = `uuid ${uuid} public key error: ${status}`
          console.error(error)
          reject(null)
        } else {
          public_key = String(res.data)
          await db.updateUserInfo({
            uuid,
            public_key,
          })
          resolve(public_key)
        }
      })

    const getUserInfo = (uuid: string, refresh = false): Promise<dbType.User> =>
      new Promise(async (resolve, reject) => {
        if (!refresh) {
          // todo: 根据 save_unix 时间动态刷新这个
          let info = await db.getUserInfo(uuid)
          if (info) {
            return resolve(info)
          }
        }

        storage
          .get(`${commonPath.getUserInfoPath(uuid)}${refresh ? `?time=${getUnix()}` : ''}`)
          .then((res) => {
            if (res.status == 404) {
              return reject(null)
            }

            let data = pb.lonely.UserInfo.decode(res.data),
              row = {
                uuid,
                ...data,
              }

            db.updateUserInfo(row)

            return resolve(row)
          })
          .catch((err) => {
            reject(err)
          })
      })

    const changeUserInfo = async (data: dbType.User) => {
      await uploadToStorage(user_info_url.value, pb.lonely.UserInfo.encode(data).finish().slice().buffer)
      await db.updateUserInfo(data)
    }

    const getUploadToken = async (type: USER_UPLOAD_TOKEN_TYPE) =>
      instance.get('/file/token', {
        params: {
          type,
        },
      })

    const searchUserByLocal = async (value: string) =>
      await db.user
        .filter((row) => Boolean(row.username?.includes(value) || row.nickname?.includes(value)))
        .limit(10)
        .toArray()

    return {
      user_info_url,
      getUserPublic,
      getUserInfo,
      changeUserInfo,
      getUploadToken,
      searchUserByLocal,
    }
  },
  {
    persist: true,
  },
)
