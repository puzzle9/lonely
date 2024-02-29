import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as db from '@api/utils/db.ts'
import { getTimestamp } from '@api/utils/time.ts'
import { LIKE_TYPE } from '@common/like.ts'

const like = new Hono<{ Bindings: HonoBindings }>()

like.put(
  '/trigger',
  zValidator(
    'json',
    z.object({
      // @ts-ignore
      type: z.enum(Object.values(LIKE_TYPE)),
      related_id: z.string(),
    }),
  ),
  async (c) => {
    const DB = db.getDB(c.env)
    let json = await c.req.json()

    let user_uuid = c.get('AuthPayload').uuid,
      type = json.type,
      related_id = json.related_id

    // prettier-ignore
    const query_where_default = [
      db.expressions.isNull(db.like.deleted_at),
      db.expressions.eq(db.like.type, type),
      db.expressions.eq(db.like.related_id, related_id)
    ]

    let row = await DB.query.like.findFirst({
      columns: {
        id: true,
      },
      // prettier-ignore
      where: db.expressions.and(
        ...query_where_default,
        db.expressions.eq(db.like.user_uuid, user_uuid)
      ),
    })

    let date = getTimestamp().toString(),
      is_like: boolean

    if (row) {
      await DB.update(db.like)
        .set({
          deleted_at: date,
        })
        .where(db.expressions.eq(db.like.id, row.id))
        .execute()
      is_like = false
    } else {
      await DB.insert(db.like)
        .values({
          type,
          related_id,
          user_uuid,
          created_at: date,
        })
        .execute()
      is_like = true
    }

    let count_like = (
      await DB.select({
        count: db.count(),
      })
        .from(db.like)
        .where(db.expressions.and(...query_where_default))
    )[0].count

    switch (type) {
      case LIKE_TYPE.forum_info:
        await DB.update(db.forum)
          .set({
            count_like,
          })
          .where(db.expressions.eq(db.forum.ulid, related_id))
          .execute()
        break
      case LIKE_TYPE.forum_comment:
        await DB.update(db.comment)
          .set({
            count_like,
          })
          .where(db.expressions.eq(db.comment.ulid, related_id))
          .execute()
        break
      default:
        break
    }

    return c.json({
      is_like,
      count_like: count_like,
    })
  },
)

export default like
