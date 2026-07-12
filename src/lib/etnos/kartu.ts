// Kartu WA: a WhatsApp-shareable image card for posts, rendered with a
// plain 2d canvas (no dependencies). Honai Metro language: cream paper,
// terracotta accent bar, ink text, no gradients.

export interface KartuOpts {
  title: string
  community: string
  author?: string
  url: string
}

const SIZE = 1080
const MARGIN = 96

const CREAM = '#e3dabf'
const TERRACOTTA = '#8c4529'
const INK = '#1c1917'
const MUTED = '#57534e'
const HAIRLINE = '#a8a29e'

const STACK = '"Plus Jakarta Sans", system-ui, sans-serif'
const font = (weight: number, px: number) => `${weight} ${px}px ${STACK}`

/** Trim `text` with a trailing ellipsis until it fits `maxWidth`. */
function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let out = text
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth)
    out = out.slice(0, -1).trimEnd()
  return out + '…'
}

/**
 * Greedy word wrap against ctx.measureText. Words longer than a full line
 * are hard-broken by character; if the text overflows `maxLines`, the last
 * line is ellipsized.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  let truncated = false

  outer: for (let word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate
      continue
    }
    if (line) {
      lines.push(line)
      line = ''
      if (lines.length === maxLines) {
        truncated = true
        break
      }
    }
    // A single word wider than the line: hard-break by character.
    while (ctx.measureText(word).width > maxWidth) {
      let cut = 1
      while (
        cut < word.length &&
        ctx.measureText(word.slice(0, cut + 1)).width <= maxWidth
      )
        cut++
      lines.push(word.slice(0, cut))
      word = word.slice(cut)
      if (lines.length === maxLines) {
        truncated = true
        break outer
      }
    }
    line = word
  }

  if (line) {
    if (lines.length < maxLines) lines.push(line)
    else truncated = true
  }
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1]
    lines[lines.length - 1] = ellipsize(ctx, last + '…', maxWidth)
  }
  return lines
}

/** Render the 1080x1080 PNG card. */
export async function renderKartu(opts: KartuOpts): Promise<Blob> {
  // Nudge the webfont weights into the font cache before drawing; if the
  // webfont never loads the canvas quietly falls back to system-ui.
  try {
    await Promise.all(
      [font(700, 72), font(700, 48), font(600, 36), font(400, 32)].map((f) =>
        document.fonts.load(f),
      ),
    )
    await document.fonts.ready
  } catch {
    // draw with the fallback stack
  }

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('kartu: canvas 2d context unavailable')

  const maxWidth = SIZE - MARGIN * 2

  // Paper.
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Terracotta bar across the very top.
  ctx.fillStyle = TERRACOTTA
  ctx.fillRect(0, 0, SIZE, 6)

  ctx.textBaseline = 'top'

  // Wordmark.
  ctx.fillStyle = INK
  ctx.font = font(700, 48)
  ctx.fillText('ETNOS', MARGIN, 84)
  ctx.fillStyle = MUTED
  ctx.font = font(400, 28)
  ctx.fillText('ruang publik Tanah Papua', MARGIN, 148)

  // Hero title.
  ctx.fillStyle = INK
  ctx.font = font(700, 72)
  const titleTop = 236
  const lineHeight = 86
  const lines = wrapText(ctx, opts.title.trim(), maxWidth, 7)
  for (let i = 0; i < lines.length; i++)
    ctx.fillText(lines[i], MARGIN, titleTop + i * lineHeight)

  // Community, with the author beside it when there is room.
  const metaTop = titleTop + lines.length * lineHeight + 44
  ctx.font = font(600, 36)
  ctx.fillStyle = TERRACOTTA
  const communityText = ellipsize(ctx, `c/${opts.community}`, maxWidth)
  ctx.fillText(communityText, MARGIN, metaTop)
  if (opts.author) {
    const used = ctx.measureText(communityText).width
    const room = maxWidth - used
    if (room > 160) {
      ctx.fillStyle = MUTED
      ctx.fillText(ellipsize(ctx, ` · ${opts.author}`, room), MARGIN + used, metaTop)
    }
  }

  // Footer: hairline rule, url left, site name right (only when the url
  // itself is not already an etnos.pages.dev link).
  ctx.fillStyle = HAIRLINE
  ctx.fillRect(MARGIN, 948, maxWidth, 1)

  ctx.font = font(400, 32)
  ctx.fillStyle = MUTED
  const site = 'etnos.pages.dev'
  let siteWidth = 0
  if (!opts.url.includes(site)) {
    siteWidth = ctx.measureText(site).width
    ctx.fillText(site, SIZE - MARGIN - siteWidth, 972)
  }
  const displayUrl = opts.url.replace(/^https?:\/\//, '')
  const urlWidth = maxWidth - (siteWidth ? siteWidth + 48 : 0)
  ctx.fillText(ellipsize(ctx, displayUrl, urlWidth), MARGIN, 972)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('kartu: toBlob failed')),
      'image/png',
    )
  })
}

/** Plain-text fallback for the wa.me share link. */
export function kartuText(opts: KartuOpts): string {
  return `${opts.title} - ${opts.url}`
}
