import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

import forum from '@/router/forum.ts'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: () => import('@/views/index.vue'),
    redirect: {
      name: 'ForumList',
    },
    children: [...forum],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || ''} | lonely`
  next()
})

export default router

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    keepAlive: boolean
  }
}
