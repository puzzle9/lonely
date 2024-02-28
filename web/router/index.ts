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
  /**
   * fixme: pc 记录滚动存在问题
   * 这个搭建的有问题 绝对定位 相对定位
   */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes,
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || ''} | lonely`
  next()
})

export default router

// prettier-ignore
export const KEEP_ALIVE_NAME = [
  'ForumList'
]

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}
