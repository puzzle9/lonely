import { blobToWebP } from 'webp-converter-browser'

export const imageToWebp = (file: File, quality = 0.9, width = 0, height = 0) =>
  blobToWebP(file, {
    quality,
    width,
    height,
  })

export const fileIsImage = (file: File) => file.type.startsWith('image/')
