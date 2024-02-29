import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ulid } from 'ulidx'
import * as pb from '@protos/index'
import * as db from '@api/utils/db.ts'
import { getTimestamp } from '@api/utils/time.ts'
import { encode } from 'uint8-to-base64'
import { COLOR_DARK_ROOM } from '@common/colors.ts'
import { FORUM_PAGE_SIZE } from '@common/forum.ts'

const forum = new Hono<{ Bindings: HonoBindings }>()

forum.get(
  '/latest',
  zValidator(
    'query',
    z.object({
      type: z.enum(['after', 'before']),
      value: z.string(),
      color: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let query = c.req.query()
    let type = query.type,
      symbol = db.expressions.lt,
      value = query.value,
      orderBy = db.expressions.desc(db.forum.ulid)

    if (type == 'before') {
      symbol = db.expressions.gt
      value = value || '0'
      orderBy = db.expressions.asc(db.forum.ulid)
    }

    let data = await DB.query.forum.findMany({
      columns: {
        ulid: true,
        user_uuid: true,
        visibility: true,
        color: true,
        author: true,
        data: true,
        count_like: true,
        count_comment: true,
        created_at: true,
      },
      // prettier-ignore
      where: db.expressions.and(
        symbol(db.forum.ulid, value || '9999'),
        db.expressions.and(
          db.expressions.isNull(db.forum.deleted_at),
          db.expressions.eq(db.forum.color, query.color),
          db.expressions.eq(db.forum.visibility, 'public')
        )
      ),
      limit: FORUM_PAGE_SIZE,
      orderBy,
    })

    return c.json(
      data.map((row) =>
        encode(
          pb.lonely.ForumInfo.encode(
            pb.lonely.ForumInfo.fromObject({
              ...row,
              author: JSON.parse(row.author),
              data: JSON.parse(row.data),
            }),
          ).finish(),
        ),
      ),
    )
  },
)

forum.post('/post', async (c) => {
  let body = await c.req.arrayBuffer(),
    data: pb.lonely.IForumInfo | null = null
  try {
    data = pb.lonely.ForumInfo.decode(new Uint8Array(body)).toJSON()
  } catch (err) {
    console.error(`forum post err: ${err}`)
  }
  if (!data) {
    return c.text('数据获取失败', 422)
  }

  const DB = db.getDB(c.env)

  let auth = c.get('AuthPayload'),
    id = ulid()

  // prettier-ignore
  await DB.insert(db.forum).values({
    // why Object literal may only specify known properties, and ulid does not exist in type
    // @ts-ignore
    ulid: id,
    user_uuid: auth.uuid,
    visibility: data.visibility,
    color: data.color,
    author: JSON.stringify(<pb.lonely.ForumInfo.IAuthor>{
      username: auth.username?.toString(),
      nickname: auth.nickname?.toString()
    }),
    data: JSON.stringify(data.data),
    created_at: getTimestamp().toString()
  }).execute()

  return c.json({
    id,
  })
})

forum.delete(
  '/delete',
  zValidator(
    'query',
    z.object({
      ulid: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let query = c.req.query()

    // prettier-ignore
    await DB.update(db.forum).set({
      deleted_at: getTimestamp().toString()
    }).where(db.expressions.and(
      db.expressions.eq(db.forum.ulid, query.ulid),
      db.expressions.eq(db.forum.user_uuid, c.get('AuthPayload').uuid)
    )).execute()

    return c.text('删除成功')
  },
)

forum.put(
  '/block',
  zValidator(
    'json',
    z.object({
      ulid: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let json = await c.req.json()

    // prettier-ignore
    await DB.update(db.forum).set({
      color: COLOR_DARK_ROOM,
      updated_at: getTimestamp().toString()
    }).where(db.expressions.and(
      db.expressions.eq(db.forum.ulid, json.ulid),
      db.expressions.ne(db.forum.color, COLOR_DARK_ROOM)
    )).execute()

    return c.text('已关进小黑屋')
  },
)

forum.get(
  '/info',
  zValidator(
    'query',
    z.object({
      ulid: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let query = c.req.query()

    let data = await DB.query.forum.findFirst({
      columns: {
        ulid: true,
        user_uuid: true,
        visibility: true,
        color: true,
        author: true,
        data: true,
        count_like: true,
        count_comment: true,
        created_at: true,
      },
      // prettier-ignore
      where: db.expressions.and(
        db.expressions.eq(db.forum.ulid, query.ulid),
        db.expressions.and(
          db.expressions.isNull(db.forum.deleted_at),
          db.expressions.eq(db.forum.visibility, 'public')
        )
      ),
    })

    if (!data?.ulid) {
      return c.text('帖子找不到了', 404)
    }

    return c.json(
      encode(
        pb.lonely.ForumInfo.encode(
          pb.lonely.ForumInfo.fromObject({
            ...data,
            author: JSON.parse(data.author),
            data: JSON.parse(data.data),
          }),
        ).finish(),
      ),
    )
  },
)

export default forum
