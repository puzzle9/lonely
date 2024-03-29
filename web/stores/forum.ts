import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as pb from '@protos/index'
import { decode } from 'uint8-to-base64'
import { instance } from '@/utils/axios.ts'
import db from '@/utils/db.ts'

export default defineStore(
  'forum',
  () => {
    const last_post_body = ref()

    const forumPost = async (data: pb.lonely.IForumInfo) =>
      instance.post('/forum/post', pb.lonely.ForumInfo.encode(data).finish().slice().buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })

    const forumLists = async (type: 'after' | 'before', value: string, color: string | null): Promise<pb.lonely.IForumInfo[]> =>
      new Promise(async (resolve) => {
        let data: object[] = await instance.get('/forum/latest', {
          params: {
            type,
            value,
            color,
          },
        })

        let row = data.map((row: any) => {
          let info = pb.lonely.ForumInfo.decode(decode(row))
          db.updateUserInfo({
            uuid: info.user_uuid,
            ...info.author,
          })

          db.updateForum(info)

          return info
        })

        resolve(row)
      })

    const forumDelete = (ulid: string) =>
      instance.delete('/forum/delete', {
        params: {
          ulid,
        },
      })

    const forumBlock = (ulid: string) =>
      instance.put('/forum/block', {
        ulid,
      })

    const forumInfo = (ulid: string): Promise<pb.lonely.IForumInfo> =>
      new Promise(async (resolve, reject) => {
        let data = await db.getForumInfo(ulid)
        if (data) {
          return resolve(data)
        }

        instance
          .get('/forum/info', {
            params: {
              ulid,
            },
          })
          .then((row) => {
            let info = pb.lonely.ForumInfo.decode(decode(row))
            db.updateForum(info)

            resolve(info)
          })
          .catch((err) => {
            reject(err)
          })
      })

    return {
      last_post_body,
      forumPost,
      forumLists,
      forumDelete,
      forumBlock,
      forumInfo,
    }
  },
  {
    persist: true,
  },
)
