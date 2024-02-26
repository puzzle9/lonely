import { RouteRecordRaw } from 'vue-router'

export default <RouteRecordRaw[]>[
  {
    path: 'setting',
    name: 'Setting',
    component: () => import('@/views/setting/index.vue'),
  },
]
