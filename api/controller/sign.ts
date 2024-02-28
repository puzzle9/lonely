import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { sign as jwtSign } from 'hono/jwt'
import { ed25519 } from '@noble/curves/ed25519'
import { utf8ToBytes } from '@noble/ciphers/utils'
import { decode } from 'uint8-to-base64'
import * as commonPath from '@common/path.ts'
import { getTimestamp } from '@api/utils/time.ts'
import { generateR2SignUrl } from '@api/utils/r2.ts'

const sign = new Hono<{ Bindings: HonoBindings }>()

sign.post(
  '/',
  zValidator(
    'json',
    z.object({
      username: z.string(),
      uuid: z.string().uuid(),
      signature: z.string(),
      time: z.number().min(getTimestamp() - 60),
    }),
  ),
  async (c) => {
    let body = await c.req.json(),
      username = body.username,
      uuid = body.uuid,
      time = body.time,
      path_public_key = commonPath.getUserPublicPath(uuid),
      public_key = await c.env.R2.get(path_public_key)

    if (public_key) {
      let public_key_value = await public_key.text()

      let verify
      try {
        verify = ed25519.verify(
          decode(body.signature),
          utf8ToBytes(
            JSON.stringify({
              username,
              uuid,
              time,
            }),
          ),
          decode(public_key_value),
        )
      } catch (e) {}

      if (!verify) {
        return c.text('验证失败、可能因为时间不准吧', 422)
      }
    }

    let exp = 60 * 60 * 24 * 7

    return c.json({
      token: await jwtSign(
        {
          uuid,
          nickname: username,
          username,
          exp: getTimestamp() + exp,
        },
        c.env.JWT_SECRET,
      ),
      uploads: {
        info: await generateR2SignUrl(c.env, commonPath.getUserInfoPath(uuid), exp),
        public: public_key ? null : await generateR2SignUrl(c.env, path_public_key, 120),
        private: public_key ? null : await generateR2SignUrl(c.env, commonPath.getUserPrivatePath(uuid), 120),
      },
    })
  },
)

export default sign
