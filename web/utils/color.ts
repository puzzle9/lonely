import naiveStore from '@/stores/naive.ts'

/**
 * 基于颜色 呈现类似节点的效果
 * https://htmlcolorcodes.com/
 */

interface ideas {
  light?: string
  dark?: string
}

export const COLOR_DEFAULT = '#FFFFFFFF'

export const ideas: Record<string, ideas> = {
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
  '#000000': {
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
export const tips: string[] = [
  // ...
  '记录一下此刻呀',
  '恭喜发现一个隐藏领域',
  '说说新鲜事呀',
  '有什么可以匿名分享秘密吗'
]

export const getTipByColor = (color: string): string => {
  let tip: string | undefined
  if (color != COLOR_DEFAULT && color in ideas) {
    // @ts-ignore
    tip = ideas[color][naiveStore().theme_name]
  }

  if (!tip) {
    let data = [...tips, ...Object.values(ideas[COLOR_DEFAULT])]
    tip = <string>data[Math.floor(Math.random() * data.length)]
  }

  return tip
}
