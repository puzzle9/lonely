import { Hono } from 'hono'
import { logger } from 'hono/logger'
import auth from './utils/auth'
import * as controller from './controller'

const app = new Hono<{ Bindings: HonoBindings }>().basePath('/api')
app.use(logger())
app.use(auth())

app.get('/', (c) => {
  return c.json({
    time: new Date(),
    version: c.env.VERSION,
  })
})

app.route('/sign', controller.Sign)
app.route('/file', controller.File)
app.route('/forum', controller.Forum)

export default app
