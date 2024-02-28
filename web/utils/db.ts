import Dexie, { Table } from 'dexie'
import * as pb from '@protos/index'
import { getUnix } from '@/utils/dayjs.ts'

const version = 240228

export interface User extends pb.lonely.IUserInfo {
  uuid: string
  public_key?: string
  save_unix?: number
}

export interface Forum extends pb.lonely.IForumInfo {
  ulid: string
  save_unix?: number
}

export default new (class extends Dexie {
  user!: Table<User>
  forum!: Table<Forum>

  constructor() {
    super('lonely')

    this.version(version).stores({
      user: '&uuid,username,nickname',
      forum: `&ulid,user_uuid,color`,
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
})()
