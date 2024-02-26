import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export default dayjs

export const getFormatDate = (template = 'YYYY-MM-DD HH:mm:ss') => dayjs().format(template)

export const getUnix = () => dayjs().unix()

export const getUnixFormNow = (unix: number | string) => dayjs.unix(Number(unix)).fromNow()

export const getUnixFormatDate = (unix: number | string, template = 'YYYY-MM-DD HH:mm:ss') => dayjs.unix(Number(unix)).format(template)

/**
 * 与当前时间比较
 * 默认 在10分钟之前
 * @param unix
 * @param compare after 之前 before 之后
 * @param second 秒数
 */
export const unixCompareNow = (unix: number | string, compare = 'after', second = 60 * 10): boolean => {
  let time = dayjs.unix(Number(unix)),
    now = dayjs()
  switch (compare) {
    case 'after':
      return time.isAfter(now.subtract(second, 'second'))
    case 'before':
      return time.isBefore(now.add(second, 'second'))
    default:
      return false
  }
}
