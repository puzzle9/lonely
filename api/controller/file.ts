import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { nanoid } from 'nanoid/non-secure'
import { getFormatDate } from '@api/utils/time.ts'
import { generateR2SignUrl } from '@api/utils/r2.ts'

const file = new Hono<{ Bindings: HonoBindings }>()

const TYPE_IMAGE = 'image'

file.get(
  '/token',
  zValidator(
    'query',
    z.object({
      type: z.enum([TYPE_IMAGE]),
    }),
  ),
  async (c) => {
    let type = c.req.query().type,
      path = `files/${getFormatDate('YY/M/D')}/${type}/${nanoid()}`
    return c.json({
      upload_url: await generateR2SignUrl(c.env, path, 180),
      path,
    })
  },
)

file.put('/upload', async (c) => {
  c.text('todo: ...')
})

export default file
