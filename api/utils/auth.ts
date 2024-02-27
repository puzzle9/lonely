import { MiddlewareHandler } from 'hono/types'
import { verify as JwtVerify } from 'hono/jwt'
import { validate as uuidValidate, version as uuidVersion } from 'uuid'

declare module 'hono' {
  interface ContextVariableMap {
    AuthPayload: {
      uuid: string
      username?: string
      nickname?: string
    }
  }
}

export default function (): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.path == '/api/') {
      return next()
    }
    
    const authorization = c.req.raw.headers.get('Authorization')
    if (!authorization) {
      return c.text('no authorization', 401)
    }
    const parts = authorization.split(/\s+/)
    if (parts.length != 2) {
      return c.text('error authorization', 401)
    }

    const token = parts[1]

    // uuid v4 会存在冒名顶替现象。。。
    if (uuidValidate(token) && uuidVersion(token) == 4) {
      c.set('AuthPayload', {
        uuid: token,
        nickname: parts[0].split('-').at(-1),
      })
      return next()
    }

    try {
      let payload = await JwtVerify(token, c.env.JWT_SECRET)
      c.set('AuthPayload', payload)
      return next()
    } catch (err) {
      console.error(`jwt err: ${err}`)
      return c.text(`jwt err`, 401)
    }
  }
}
