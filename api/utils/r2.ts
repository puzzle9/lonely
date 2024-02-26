// @ts-ignore
import { AwsClient } from 'aws4fetch'

/**
 * 生成预签名url
 * @param env
 * @param pathname 路径开始不要/
 * @param expires 过期时间 秒
 */
export const generateR2SignUrl = async (env: HonoBindings, pathname: string, expires = 3600) => {
  // todo: https://stackoverflow.com/questions/25991275/limit-size-of-objects-while-uploading-to-amazon-s3-using-pre-signed-url
  let url = new URL(`https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`)
  url.pathname = `${env.R2_BUCKET_NAME}/${pathname}`
  url.searchParams.set('X-Amz-Expires', String(expires))

  let client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  })

  const signed = await client.sign(
    new Request(url, {
      method: 'PUT',
    }),
    {
      aws: { signQuery: true },
    },
  )

  return signed.url
}
