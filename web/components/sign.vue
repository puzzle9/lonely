<template>
  <n-modal
    class="sign"
    v-model:show="storeSign.show"
    preset="card"
    size="small"
    :mask-closable="false"
    :bordered="false"
    :style="{
      width: '360px',
    }">
    <n-card content-style="margin-top: -10px; padding-top: 0" :bordered="false">
      <n-tabs v-model:value="storeSign.type" size="large" justify-content="space-evenly">
        <n-tab name="in">登录</n-tab>
        <n-tab name="reg">注册</n-tab>
        <!-- todo: 助记词恢复-->
      </n-tabs>
      <br />
      <n-form ref="form_ref" :model="form_data" :rules="form_rules">
        <n-form-item-row label="用户名" path="username">
          <n-input v-model:value="form_data.username" placeholder="请输入用户名" clearable />
        </n-form-item-row>
        <n-form-item-row label="密码" path="password">
          <n-input type="password" show-password-on="click" v-model:value="form_data.password" placeholder="请输入密码" @keyup.enter.prevent="formSubmit" clearable />
        </n-form-item-row>
      </n-form>
      <n-button type="primary" block secondary strong :loading="form_loading" @click="formSubmit">
        {{ storeSign.isShowIn ? '登录' : '注册' }}
      </n-button>
    </n-card>
  </n-modal>
</template>
<script setup lang="tsx">
  import { ref } from 'vue'
  import { useClipboard } from '@vueuse/core'
  import { FormInst, FormRules, FormItemRule } from 'naive-ui'

  import { getUsernameUUID } from '@/utils/uuid.ts'
  import naiveStore from '@/stores/naive.ts'
  import userStore from '@/stores/user.ts'
  import signStore from '@/stores/sign.ts'

  const storeNaive = naiveStore(),
    storeUser = userStore(),
    storeSign = signStore()

  interface form_data {
    username: string
    password: string
  }

  const form_ref = ref<FormInst | null>(null),
    form_data = ref<form_data>({
      username: '',
      password: '',
    }),
    form_rules: FormRules = {
      username: [
        {
          required: true,
          message: '请输入用户名',
          trigger: ['input', 'blur'],
        },
        {
          required: true,
          asyncValidator(rule: FormItemRule, value: string) {
            return new Promise(async (resolve, reject) => {
              if (!value) {
                return resolve()
              }

              let public_key = await storeUser.getUserPublic(getUsernameUUID(value)).catch(() => null)
              if (storeSign.isShowIn) {
                if (!public_key) {
                  return reject(new Error('用户名不存在'))
                }
              } else {
                if (public_key) {
                  return reject(new Error('用户名已存在'))
                }
              }
              return resolve()
            })
          },
          trigger: ['blur'],
        },
      ],
      password: [
        {
          required: true,
          message: '请输入密码',
          trigger: ['input', 'blur'],
        },
      ],
    },
    form_loading = ref(false),
    formSubmit = async () => {
      await form_ref.value?.validate()

      form_loading.value = true

      let username = form_data.value.username,
        password = form_data.value.password

      storeSign[storeSign.isShowIn ? 'signIn' : 'signReg'](username, password)
        // @ts-ignore
        .then((res: { username: string; mnemonic?: string[] }) => {
          storeSign.show = false

          let mnemonic = res.mnemonic,
            mnemonic_string = mnemonic?.join(' ')

          if (!mnemonic) {
            storeNaive.message.success(`欢迎回来 ${res.username}`, {
              showIcon: false,
            })
          } else {
            storeNaive.dialog.create({
              title: '注册成功 请保护好助记词',
              content: () => (
                <n-grid cols="6">
                  <n-gi span="2">
                    <n-qr-code value={mnemonic_string}></n-qr-code>
                  </n-gi>
                  <n-gi span="4" style="text-align:center; display: flex;">
                    <n-grid cols="6">
                      {mnemonic?.map((info) => {
                        return <n-gi>{info}</n-gi>
                      })}
                    </n-grid>
                  </n-gi>
                </n-grid>
              ),
              closable: false,
              closeOnEsc: false,
              maskClosable: false,
              showIcon: false,
              negativeText: '复制',
              onNegativeClick: () => {
                useClipboard().copy(mnemonic_string as string)
                storeNaive.message.info(`复制成功`)
                return false
              },
              positiveText: '我记下了',
            })
          }
        })
        .catch((error) => {
          storeNaive.message.error(error)
        })
        .finally(() => {
          form_loading.value = false
        })
    }
</script>
<style scoped lang="stylus"></style>
