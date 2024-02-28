import { defineStore } from 'pinia'
import { Ref, ref, computed } from 'vue'
import userStore from '@/stores/user.ts'
import { instance, storage, uploadToStorage } from '@/utils/axios.ts'
import { getFormatDate, getUnix } from '@/utils/dayjs.ts'
import * as crypto from '@/utils/crypto.ts'
import * as commonPath from '@common/path.ts'
import { getUsernameUUID } from '@/utils/uuid.ts'

type Type = Ref<'in' | 'reg'>

export default defineStore(
  'sign',
  () => {
    const type: Type = ref('in'),
      show = ref(false),
      isShowIn = computed(() => type.value == 'in')

    const showIn = () => {
        show.value = true
        type.value = 'in'
      },
      showReg = () => {
        show.value = true
        type.value = 'reg'
      }

    const storeUser = userStore()

    const user_token = ref(),
      user_uuid = ref(),
      user_uuid_temp = ref(),
      user_username = ref(),
      user_public_key = ref(),
      user_private_key = ref(),
      user_mnemonic = ref()

    /**
     * 此处加入 uuid 是服务端拿不到 username 后的 uuid 。。。
     * @param username
     * @param uuid
     * @param private_key
     */
    const getSignToken = (
      username: string,
      uuid: string,
      private_key: string,
    ): Promise<{
      token: string
      uploads: {
        info: string
        public: string | null
        private: string | null
      }
    }> => {
      user_username.value = username
      user_private_key.value = private_key

      let time = getUnix()
      return instance.post('/sign', {
        username,
        uuid,
        signature: crypto.signature(
          {
            username,
            uuid,
            time,
          },
          private_key,
        ),
        time,
      })
    }

    /**
     * 登录
     * 将用户名转为uuid
     * 用密码和公钥解密自己的私钥
     * 只要解密成功说明帐号密码是对的
     * 再去用私钥生成签名
     * 去服务端仅获取可以更新个人信息的地址
     */
    const signIn = (username: string, password: string) =>
        new Promise(async (resolve, reject) => {
          let uuid = getUsernameUUID(username),
            public_key = await storeUser.getUserPublic(uuid).catch(() => null)

          if (!public_key) {
            return reject('用户名不存在')
          }

          let key = crypto.getUserPrivateDecodeKey(public_key, password),
            private_key_encode = (await storage.get(commonPath.getUserPrivatePath(uuid))).data,
            private_key = await crypto.decodeData(private_key_encode, key).catch(() => null)

          if (!private_key) {
            return reject('密码错误')
          }

          let datas = await getSignToken(username, uuid, private_key).catch(() => null)
          if (!datas) {
            return reject('登录失败')
          }
          storeUser.user_info_url = datas.uploads.info
          user_token.value = datas.token
          user_uuid.value = uuid
          user_public_key.value = public_key

          resolve({
            username,
          })
        }),
      signReg = (username: string, password: string) =>
        new Promise(async (resolve, reject) => {
          let uuid = getUsernameUUID(username)
          if (username && (await storeUser.getUserPublic(uuid).catch(() => null))) {
            return reject('用户名已存在')
          }

          let keys = crypto.generateUserKey(),
            mnemonic = keys.mnemonic,
            public_key = keys.public,
            private_key = keys.private,
            key = crypto.getUserPrivateDecodeKey(keys.public, password),
            private_key_encode = await crypto.encodeData(private_key, key)

          user_public_key.value = public_key
          user_mnemonic.value = mnemonic

          let datas = await getSignToken(username, uuid, private_key).catch(() => null)
          if (!datas) {
            return reject('注册失败')
          }
          user_token.value = datas.token
          user_uuid.value = uuid
          storeUser.user_info_url = datas.uploads.info

          if (datas.uploads.public) {
            await uploadToStorage(datas.uploads.public, public_key)
          }
          if (datas.uploads.private) {
            await uploadToStorage(datas.uploads.private, private_key_encode)
          }

          await storeUser.changeUserInfo({
            uuid,
            username,
            created_at: getFormatDate(),
            updated_at: getFormatDate(),
            public_key,
          })

          resolve({
            username,
            mnemonic,
          })
        }),
      /**
       * 退出登录
       * 因为快捷登录或什么 暂不清空其他数据
       */
      signOut = () => {
        user_token.value = null
        user_username.value = null
      }

    // 生成临时uuid
    const getTempUUID = () => {
      let uuid = user_uuid_temp.value || getUsernameUUID()
      user_uuid_temp.value = uuid
      return uuid
    }

    return {
      type,
      show,
      isShowIn,
      user_token,
      user_uuid,
      user_uuid_temp,
      user_username,
      user_public_key,
      user_private_key,
      user_mnemonic,
      showIn,
      showReg,
      signIn,
      signReg,
      signOut,
      getTempUUID,
    }
  },
  {
    persist: true,
  },
)
