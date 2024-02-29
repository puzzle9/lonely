import { defineStore } from 'pinia'
import { computed } from 'vue'
import { instance } from '@/utils/axios.ts'
import db from '@/utils/db.ts'
import { TYPE_LIKE_TYPE } from '@common/like.ts'

import signStore from '@/stores/sign.ts'

interface LIKE_TRIGGER_RESPONSE {
  count_like: number
  is_like: boolean
}

export default defineStore(
  'like',
  () => {
    const user_uuid = computed(() => signStore().user_uuid)

    const likesInfo = async (related_type: TYPE_LIKE_TYPE, related_id: string) =>
      db.likes
        .where({
          related_type,
          related_id,
        })
        .first()

    const isLike = async (type: TYPE_LIKE_TYPE, related_id: string) => Boolean((await likesInfo(type, related_id))?.is_like)

    const likeTrigger = (type: TYPE_LIKE_TYPE, related_id: string): Promise<LIKE_TRIGGER_RESPONSE> =>
      new Promise(async (resolve, reject) => {
        instance
          .put('/like/trigger', {
            type,
            related_id,
          })
          // @ts-ignore
          .then(async (res: LIKE_TRIGGER_RESPONSE) => {
            db.likes.put({
              related_type: type,
              related_id,
              user_uuid: user_uuid.value,
              is_like: res.is_like,
              count_like: res.count_like,
            })
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })

    return {
      likesInfo,
      isLike,
      likeTrigger,
    }
  },
  {
    // persist: true,
  },
)
