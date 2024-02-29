import { sqliteTable, integer, text, blob } from 'drizzle-orm/sqlite-core'
import { drizzle } from 'drizzle-orm/d1'
import * as expressions from 'drizzle-orm/expressions'
import { count } from 'drizzle-orm'

export { expressions, count }

export const forum = sqliteTable('forums', {
  ulid: text('ulid').primaryKey().notNull(),
  user_uuid: text('user_uuid').notNull(),
  visibility: text('visibility'),
  color: text('color').notNull(),
  author: text('author').notNull(),
  data: text('data').notNull(),
  count_like: integer('count_like').default(0),
  count_comment: integer('count_comment').default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at'),
  deleted_at: text('deleted_at'),
})

export const like = sqliteTable('likes', {
  id: integer('id').primaryKey(),
  type: text('type').notNull(),
  related_id: text('related_id').notNull(),
  user_uuid: text('user_uuid').notNull(),
  created_at: text('created_at').notNull(),
  deleted_at: text('deleted_at'),
})

export const comment = sqliteTable('comments', {
  ulid: text('ulid').notNull(),
  type: text('type').notNull(),
  related_id: text('related_id').notNull(),
  user_uuid: text('user_uuid').notNull(),
  data: text('data').notNull(),
  count_like: integer('count_like').default(0),
  created_at: text('created_at').notNull(),
  deleted_at: text('deleted_at'),
})

const schema = {
  forum,
  like,
  comment,
}

export const getDB = (env: HonoBindings) =>
  drizzle(env.DB, {
    schema,
  })
