import { RouteRecordRaw } from 'vue-router'

export default <RouteRecordRaw[]>[
  {
    path: 'forum',
    name: 'Forum',
    component: () => import('@/components/RouteView.vue'),
    children: [
      {
        path: 'lists',
        name: 'ForumList',
        meta: {
          title: '帖子列表',
          keepAlive: true,
        },
        component: () => import('@/views/forum/list.vue'),
      },
    ],
  },
]
