type HonoBindings = {
  R2: R2Bucket
  DB: D1Database
  KV: KVNamespace
  CLOUDFLARE_ACCOUNT_ID: string
  VERSION: string
  JWT_SECRET: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
}

// https://stackoverflow.com/a/70798250/6686061
declare module 'uint8-to-base64'
