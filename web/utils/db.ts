import Dexie, { Table } from 'dexie'
import * as pb from '@protos/index'
import { getUnix } from '@/utils/dayjs.ts'

const version = 240210

export interface User extends pb.lonely.IUserInfo {
  uuid: string
  public_key?: string
  save_unix?: number
}

export default new (class extends Dexie {
  user!: Table<User>

  constructor() {
    super('lonely')

    this.version(version).stores({
      user: '&uuid,username,nickname',
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
})()
