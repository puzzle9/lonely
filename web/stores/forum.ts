import { defineStore } from 'pinia'
import * as pb from '@protos/index'
import { decode } from 'uint8-to-base64'
import { instance } from '@/utils/axios.ts'
import db from '@/utils/db.ts'

export default defineStore(
  'forum',
  () => {
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

    return {
      forumPost,
      forumLists,
      forumDelete,
    }
  },
  {
    // persist: true,
  },
)
