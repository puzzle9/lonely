import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ulid } from 'ulidx'
import * as pb from '@protos/index'
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
    let query = c.req.query()
    let type = query.type,
      symbol = '<',
      value = query.value,
      sort = 'DESC'

    if (type == 'before') {
      symbol = '>'
      value = value || '0'
      sort = 'ASC'
    }

    // prettier-ignore
    let data = await c.env.DB.prepare(`
SELECT
	ulid,
	user_uuid,
	visibility,
	color,
	author,
	data,
	created_at 
FROM
	forums
WHERE
	ulid ${symbol} ?
	AND ( deleted_at IS NULL AND color = ? AND visibility = ? ) 
ORDER BY
	ulid ${sort} 
LIMIT ${FORUM_PAGE_SIZE}
`)
      .bind(value || '9999', query.color, 'public')
      .all()
    let results = data.results.map((row: any) =>
      encode(
        pb.lonely.ForumInfo.encode(
          pb.lonely.ForumInfo.fromObject({
            ...row,
            author: JSON.parse(row.author),
            data: JSON.parse(row.data),
          }),
        ).finish(),
      ),
    )
    return c.json(results)
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

  let auth = c.get('AuthPayload'),
    id = ulid()

  // prettier-ignore
  await c.env.DB.prepare(`
INSERT INTO forums ( ulid, user_uuid, visibility, color, author, data, created_at )
VALUES ( ?,?,?,?,?,?,? )
`)
    .bind(
      id,
      auth.uuid,
      data.visibility,
      data.color,
      JSON.stringify(<pb.lonely.ForumInfo.IAuthor>{
        username: auth.username?.toString(),
        nickname: auth.nickname?.toString()
      }),
      JSON.stringify(data.data),
      getTimestamp()
    )
    .run()

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
    let query = c.req.query()

    // prettier-ignore
    await c.env.DB.prepare(`
UPDATE forums SET
  deleted_at = ?
WHERE
  ulid = ?
  AND user_uuid = ? 
    `).bind(
      getTimestamp(),
      query.ulid,
      c.get('AuthPayload').uuid
    ).run()

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
    let json = await c.req.json()

    // prettier-ignore
    await c.env.DB.prepare(`
UPDATE forums SET
  color = ?
  ,updated_at = ?
WHERE
  ulid = ?
  AND color != ? 
    `).bind(
      COLOR_DARK_ROOM,
      getTimestamp(),
      json.ulid,
      COLOR_DARK_ROOM
    ).run()

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
    let query = c.req.query()
    // prettier-ignore
    let data: any = await c.env.DB.prepare(`
SELECT
	ulid,
	user_uuid,
	visibility,
	color,
	author,
	data,
	created_at 
FROM
	forums
WHERE
	ulid = ?
	AND ( deleted_at IS NULL AND visibility = ? ) 
`)
      .bind(query.ulid, 'public')
      .first()

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
