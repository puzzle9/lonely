import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ulid } from 'ulidx'
import * as pb from '@protos/index'
import * as db from '@api/utils/db.ts'
import { getTimestamp } from '@api/utils/time.ts'
import { encode } from 'uint8-to-base64'
import { COMMENT_PAGE_SIZE, COMMENT_TYPE, TYPE_COMMENT_TYPE } from '@common/comment.ts'

const comment = new Hono<{ Bindings: HonoBindings }>()

comment.get(
  '/latest',
  zValidator(
    'query',
    z.object({
      // @ts-ignore
      related_type: z.enum(Object.values(COMMENT_TYPE)),
      related_id: z.string(),
      type: z.enum(['after', 'before']),
      value: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let query = c.req.query()
    let type = query.type,
      symbol = db.expressions.lt,
      value = query.value,
      orderBy = db.expressions.desc(db.comment.ulid)

    if (type == 'before') {
      symbol = db.expressions.gt
      value = value || '0'
      orderBy = db.expressions.asc(db.comment.ulid)
    }

    let data = await DB.query.comment.findMany({
      columns: {
        ulid: true,
        user_uuid: true,
        data: true,
        count_like: true,
        created_at: true,
      },
      // prettier-ignore
      where: db.expressions.and(
        symbol(db.comment.ulid, value || '9999'),
        db.expressions.and(
          db.expressions.isNull(db.comment.deleted_at),
          db.expressions.eq(db.comment.type, query.related_type),
          db.expressions.eq(db.comment.related_id, query.related_id)
        )
      ),
      limit: COMMENT_PAGE_SIZE,
      orderBy,
    })

    return c.json(
      data.map((row) =>
        encode(
          pb.lonely.Comment.encode(
            pb.lonely.Comment.fromObject({
              ...row,
              data: JSON.parse(row.data),
            }),
          ).finish(),
        ),
      ),
    )
  },
)

const updateRelatedCount = async (env: HonoBindings, related_type: TYPE_COMMENT_TYPE, related_id: string) => {
  const DB = db.getDB(env)
  // todo: 此处或许可以改为递增 like 同理
  let count_comment = (
    await DB.select({
      count: db.count(),
    })
      .from(db.comment)
      .where(
        db.expressions.and(db.expressions.isNull(db.comment.deleted_at), db.expressions.eq(db.comment.type, related_type), db.expressions.eq(db.comment.related_id, related_id)),
      )
  )[0].count

  if (related_type == COMMENT_TYPE.forum_info) {
    await DB.update(db.forum)
      .set({
        count_comment,
      })
      .where(db.expressions.eq(db.forum.ulid, related_id))
      .execute()
  }

  return count_comment
}

comment.post('/post', async (c) => {
  let body = await c.req.arrayBuffer(),
    data: pb.lonely.IComment | null = null
  try {
    data = pb.lonely.Comment.decode(new Uint8Array(body)).toJSON()
  } catch (err) {
    console.error(`comment post err: ${err}`)
  }
  if (!data) {
    return c.text('数据获取失败', 422)
  }

  const DB = db.getDB(c.env)

  let auth = c.get('AuthPayload'),
    id = ulid()

  let type = data.type,
    related_id = data.related_id

  // prettier-ignore
  await DB.insert(db.comment).values({
    // @ts-ignore
    ulid: id,
    type,
    related_id,
    user_uuid: auth.uuid,
    data: JSON.stringify(<pb.lonely.Comment.IData>{
      body: data.data?.body,
      author: {
        username: auth.username?.toString(),
        nickname: auth.nickname?.toString()
      }
    }),
    created_at: getTimestamp().toString()
  }).execute()

  let count_comment = await updateRelatedCount(c.env, type as any, related_id as string)

  return c.json({
    ulid: id,
    count_comment,
  })
})

comment.delete(
  '/delete',
  zValidator(
    'query',
    z.object({
      // @ts-ignore
      related_type: z.enum(Object.values(COMMENT_TYPE)),
      related_id: z.string(),
      ulid: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let query = c.req.query()

    let related_type = query.related_type,
      related_id = query.related_id

    // prettier-ignore
    await DB.update(db.comment).set({
      deleted_at: getTimestamp().toString()
    }).where(db.expressions.and(
      db.expressions.eq(db.comment.ulid, query.ulid),
      db.expressions.isNull(db.comment.deleted_at),
      db.expressions.eq(db.comment.type, related_type),
      db.expressions.eq(db.comment.related_id, related_id),
      db.expressions.eq(db.comment.user_uuid, c.get('AuthPayload').uuid)
    )).execute()
    let count_comment = await updateRelatedCount(c.env, related_type as any, related_id)

    return c.json({
      count_comment,
    })
  },
)

export default comment
