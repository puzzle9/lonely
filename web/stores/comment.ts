import { defineStore } from 'pinia'
import { ComputedRef, computed, ref } from 'vue'
import * as pb from '@protos/index'
import { decode } from 'uint8-to-base64'
import { instance } from '@/utils/axios.ts'
import db from '@/utils/db.ts'
import { TYPE_COMMENT_TYPE } from '@common/comment.ts'

import signStore from '@/stores/sign.ts'

interface COMMENT_TRIGGER_RESPONSE {
  ulid?: string
  count_comment: number
}

export default defineStore(
  'comment',
  () => {
    const commentsInfo = async (related_type: TYPE_COMMENT_TYPE, related_id: string) =>
      db.comments
        .where({
          related_type,
          related_id,
        })
        .first()

    const commentLists = async (related_type: string, related_id: string, type: 'after' | 'before', value: string): Promise<pb.lonely.IForumInfo[]> =>
      new Promise(async (resolve) => {
        let data: object[] = await instance.get('/comment/latest', {
          params: {
            related_type,
            related_id,
            type,
            value,
          },
        })

        let row = data.map((row: any) => pb.lonely.Comment.decode(decode(row)).toJSON())

        resolve(row)
      })

    const commentSubmit = async (data: pb.lonely.IComment): Promise<COMMENT_TRIGGER_RESPONSE> =>
      new Promise((resolve, reject) => {
        // @ts-ignore
        instance
          .post('/comment/post', pb.lonely.Comment.encode(data).finish().slice().buffer, {
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          })
          // @ts-ignore
          .then(async (res: COMMENT_TRIGGER_RESPONSE) => {
            // @ts-ignore
            db.updateCountComment(data.type, data.related_id, res.count_comment)
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })

    const commentDelete = (ulid: string, related_type: TYPE_COMMENT_TYPE, related_id: string): Promise<COMMENT_TRIGGER_RESPONSE> =>
      new Promise((resolve, reject) => {
        instance
          .delete('/comment/delete', {
            params: {
              ulid,
              related_type,
              related_id,
            },
          })
          // @ts-ignore
          .then((res: COMMENT_TRIGGER_RESPONSE) => {
            db.updateCountComment(related_type, related_id, res.count_comment)
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })

    return {
      commentsInfo,
      commentLists,
      commentSubmit,
      commentDelete,
    }
  },
  {
    // persist: true,
  },
)
