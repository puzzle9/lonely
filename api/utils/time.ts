import dayjs from 'dayjs'

export const getTimestamp = () => dayjs().unix()

export const getFormatDate = (template = 'YYYY-MM-DD HH:mm:ss') => dayjs().format(template)
