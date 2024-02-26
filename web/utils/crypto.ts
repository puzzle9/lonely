import { encode, decode } from 'uint8-to-base64'
import * as bip39 from '@scure/bip39'
import { wordlist as simplifiedChinese } from '@scure/bip39/wordlists/simplified-chinese'
import { HDKey } from 'ed25519-keygen/hdkey'
import { ed25519 } from '@noble/curves/ed25519'

import { argon2id } from '@noble/hashes/argon2'

import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { managedNonce } from '@noble/ciphers/webcrypto'
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils'

/**
 * 加密相关
 * 通过 bip39 生成助记词 再基于 SLIP-0010 转为私钥
 * 用户的私钥 先用 argon2id 以 公钥作为 salt 及 帐号密码 生成 key 再用 xchacha20poly1305 加密
 * 加解密的 xchacha20poly1305 的 nonce 用 managedNonce 进行管理
 * 登录则服务端判断生成的签名是否正确
 */

export const getUserPrivateDecodeKey = (key_public: string, password: string): string =>
  encode(
    argon2id(password, decode(key_public), {
      t: 1,
      m: 1024 * (import.meta.env.PROD ? 64 : 1),
      p: 1,
    }),
  )

export const generateUserKey = () => {
  let mnemonic = bip39.generateMnemonic(simplifiedChinese, 256).split(' '),
    hdkey = getHDKeyByMnemonic(mnemonic)

  return {
    public: encode(hdkey.publicKeyRaw),
    private: encode(hdkey.privateKey),
    mnemonic,
  }
}

export const getHDKeyByMnemonic = (mnemonic: Array<string>) => {
  // mnemonic = ['奏', '堡', '眉', '楚', '去', '俩', '蒋', '麻', '审', '拨', '审', '佳', '迟', '懂', '阳', '备', '习', '透', '牧', '醇', '厉', '关', '藏', '年']
  let seed = bip39.mnemonicToSeedSync(mnemonic.join(' '))
  return HDKey.fromMasterSeed(seed)
}

const encodeChacha = (value: string | Uint8Array) => {
  try {
    let key = <Uint8Array>value
    if (typeof value == 'string') {
      try {
        key = decode(value)
      } catch (e) {
        key = utf8ToBytes(value)
      }
    }
    return managedNonce(xchacha20poly1305)(key.slice(0, 32))
  } catch (e) {
    throw new Error(`error encode chacha key: ${value}`)
  }
}

export const encodeData = (data: string | Uint8Array, key: string | Uint8Array): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      resolve(encode(encodeChacha(key).encrypt(data instanceof Uint8Array ? data : utf8ToBytes(data))))
    } catch (e) {
      console.error(`encode data error: ${e}`)
      reject(e)
    }
  })

export const decodeData = (ciphertext: string | Uint8Array, key: string | Uint8Array): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      resolve(bytesToUtf8(encodeChacha(key).decrypt(ciphertext instanceof Uint8Array ? ciphertext : decode(ciphertext))))
    } catch (e) {
      console.error(`decode data error: ${e}`)
      reject(e)
    }
  })

export const signature = (data: string | object, private_key: string) =>
  encode(ed25519.sign(utf8ToBytes(typeof data == 'object' ? JSON.stringify(data) : data), decode(private_key)))
