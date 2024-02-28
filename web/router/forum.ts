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
        },
        component: () => import('@/views/forum/list.vue'),
      },
      {
        path: 'info/:ulid',
        name: 'ForumInfo',
        meta: {
          title: '帖子详情',
        },
        component: () => import('@/views/forum/info.vue'),
      },
    ],
  },
]
