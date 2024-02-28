import { createPersistedState } from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import router from '@/router'
import App from '@/App.vue'

registerSW({ immediate: true })

const app = createApp(App)

const pinia = createPinia()
pinia.use(
  createPersistedState({
    key: (id) => `store_${id}`,
  }),
)
app.use(pinia)

app.use(router)

app.mount('#app')
