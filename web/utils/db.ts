import Dexie, { Table } from 'dexie'
import * as pb from '@protos/index'
import { getUnix } from '@/utils/dayjs.ts'
import { TYPE_COMMENT_TYPE } from '@common/comment.ts'
import { TYPE_LIKE_TYPE } from '@common/like.ts'

const version = 240229

export interface User extends pb.lonely.IUserInfo {
  uuid: string
  public_key?: string
  save_unix?: number
}

export interface Forum extends pb.lonely.IForumInfo {
  ulid: string
  save_unix?: number
}

export interface likes extends pb.lonely.ILike {
  related_type: TYPE_LIKE_TYPE
  related_id: string
  is_like: boolean
  count_like: number
}

export interface comments extends pb.lonely.IComment {
  related_type: TYPE_COMMENT_TYPE
  related_id: string
  count_comment?: number
}

export default new (class extends Dexie {
  user!: Table<User>
  forum!: Table<Forum>
  likes!: Table<likes>
  comments!: Table<comments>

  constructor() {
    super('lonely')

    this.version(version).stores({
      user: '&uuid,username,nickname',
      forum: `&ulid,user_uuid,color`,
      likes: '&[related_type+related_id]',
      comments: '&[related_type+related_id]',
    })
  }

  async getUserInfo(uuid: string) {
    return this.user
      .where({
        uuid,
      })
      .first()
  }

  async updateUserInfo(data: User) {
    let row = await this.getUserInfo(data.uuid)
    await this.user.put({
      ...row,
      ...data,
      save_unix: getUnix(),
    })
  }

  async getForumInfo(ulid: string) {
    return this.forum
      .where({
        ulid,
      })
      .first()
  }

  async updateForum(data: Forum) {
    let row = await this.getForumInfo(data.ulid)
    await this.forum.put({
      ...row,
      ...data,
      save_unix: getUnix(),
    })
  }

  async updateCountComment(related_type: TYPE_COMMENT_TYPE, related_id: string, count_comment: number) {
    await this.comments.put({
      related_type,
      related_id,
      count_comment,
    })
  }
})()
