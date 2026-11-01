import { request, type MediaAttachment } from './api'
export type ImageDraft = {
  key: string
  file: File
  preview: string
  alt: string
  encoded: string
  width: number
  height: number
  uploaded?: MediaAttachment
}
// Re-encode a bounded bitmap. Original metadata and filename never leave the device.
export async function prepareImage(file: File): Promise<ImageDraft> {
  if (
    !/^image\/(jpeg|png|webp)$/.test(file.type) ||
    file.size > 12 * 1024 * 1024
  )
    throw Error('Pilih JPG, PNG, atau WebP hingga 12 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw Error('Ukuran gambar terlalu besar.')
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw Error('Gambar belum dapat diproses.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    let blob: Blob | null = null
    for (const quality of [0.84, 0.7, 0.55, 0.4]) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality),
      )
      if (blob && blob.type === 'image/webp' && blob.size <= 512 * 1024) break
    }
    if (!blob || blob.type !== 'image/webp' || blob.size > 512 * 1024)
      throw Error('Gambar masih terlalu besar. Coba potong atau perkecil.')
    const raw = new Uint8Array(await blob.arrayBuffer())
    // Chromium may add its standard ICC profile. Keep only the image chunks;
    // strip all metadata, including profiles, before the upload validator.
    const view = new DataView(raw.buffer),
      chunks: Uint8Array[] = []
    let length = 12
    for (let offset = 12; offset + 8 <= raw.length;) {
      const tag = String.fromCharCode(...raw.subarray(offset, offset + 4)),
        size = view.getUint32(offset + 4, true),
        end = offset + 8 + size + (size % 2)
      if (end > raw.length) throw Error('Gambar WebP tidak valid.')
      if (['VP8X', 'ALPH', 'VP8 ', 'VP8L'].includes(tag)) {
        const chunk = raw.slice(offset, end)
        if (tag === 'VP8X') chunk[8] &= 0x10
        chunks.push(chunk)
        length += chunk.length
      }
      offset = end
    }
    const bytes = new Uint8Array(length)
    bytes.set(raw.subarray(0, 12))
    new DataView(bytes.buffer).setUint32(4, length - 8, true)
    let offset = 12
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.length
    }
    blob = new Blob([bytes], { type: 'image/webp' })
    let binary = ''
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    return {
      key: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(blob),
      alt: '',
      encoded: btoa(binary),
      width: canvas.width,
      height: canvas.height,
    }
  } finally {
    bitmap.close()
  }
}
export async function uploadImages(communityId: string, images: ImageDraft[]) {
  const ids: string[] = []
  for (const image of images) {
    // Retry an interrupted post with the same draft uploads; no duplicate uploads.
    image.uploaded ??= await request<MediaAttachment>('/v1/media', {
      communityId,
      bytes: image.encoded,
      alt: image.alt,
    })
    ids.push(image.uploaded.id)
  }
  return ids
}
