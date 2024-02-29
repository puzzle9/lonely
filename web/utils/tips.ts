import { COLOR_DARK_ROOM } from '@common/colors.ts'
import naiveStore from '@/stores/naive.ts'

/**
 * 基于颜色 呈现类似节点的效果
 * https://htmlcolorcodes.com/
 */

interface colors {
  light?: string
  dark?: string
}

export const COLOR_DEFAULT = '#FFFFFFFF'

export const colors: Record<string, colors> = {
  // White
  [COLOR_DEFAULT]: {
    light: '我还是个纯洁的孩子',
    dark: '我或许是个纯洁的孩子',
  },

  // Yellow
  '#FFFF00': {
    light: '大白天会不会不合适',
    dark: '又要搞羞羞了嘛',
  },

  // Red
  '#FF0000': {
    light: '想想都觉得激动',
    dark: '想想还觉得激动',
  },

  // Black
  [COLOR_DARK_ROOM]: {
    light: '天亮了 你问 我答',
    dark: '夜深了 你说 我听',
  },

  // Lime
  '#00FF00': {},

  // Aqua
  '#00FFFF': {},

  // Blue
  '#0000FF': {},
}

// prettier-ignore
export const default_tips: string[] = [
  // ...
  '记录一下此刻呀',
  '恭喜发现一个隐藏领域',
  '说说新鲜事呀',
  '有什么可以匿名分享秘密吗'
]

// prettier-ignore
export const comment_tips: string[] = [
  // ...
  '良言一句三冬暖',
  '说点啥子',
  '留下脚印',
  '快来评论呀',
  '参与讨论'
]

const getRandom = (data: string[]): string => data[Math.floor(Math.random() * data.length)]

export const getDefaultTipByColor = (color: string): string => {
  let tip: string | undefined
  if (color != COLOR_DEFAULT && color in colors) {
    // @ts-ignore
    tip = colors[color][naiveStore().theme_name]
  }

  if (!tip) {
    let data = [...default_tips, ...Object.values(colors[COLOR_DEFAULT])]
    tip = getRandom(data)
  }

  return tip
}

export const getCommentTip = () => getRandom(comment_tips)
