export enum LIKE_TYPE {
  forum_info = 'forum_info',
  forum_comment = 'forum_comment',
}

export type TYPE_LIKE_TYPE = LIKE_TYPE.forum_comment | LIKE_TYPE.forum_info
