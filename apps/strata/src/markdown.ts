import { marked } from 'marked'
import DOMPurify from 'dompurify'
/** Only text formatting. Raw media, scripts, SVG and remote images are excluded. */
export function markdown(text: string) {
  const html = marked.parse(text, { async: false, gfm: true, breaks: true })
  const safe = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'del',
      'a',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'details',
      'summary',
    ],
    ALLOWED_ATTR: ['href', 'title', 'start'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  })
  const template = document.createElement('template')
  template.innerHTML = safe
  for (const a of template.content.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? ''
    if (!/^(https?:\/\/|mailto:)/i.test(href)) {
      a.removeAttribute('href')
      continue
    }
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer nofollow')
    a.setAttribute('referrerpolicy', 'no-referrer')
  }
  return template.innerHTML
}
export function videoEmbed(raw: string) {
  try {
    const u = new URL(raw)
    let id: string | null = null
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
    if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)
    )
      id =
        u.pathname === '/watch'
          ? u.searchParams.get('v')
          : u.pathname.startsWith('/shorts/')
            ? u.pathname.split('/')[2]
            : null
    if (id && /^[\w-]{11}$/.test(id))
      return 'https://www.youtube-nocookie.com/embed/' + id
    if (
      ['vimeo.com', 'www.vimeo.com'].includes(u.hostname) &&
      /^\/\d{6,12}$/.test(u.pathname)
    )
      return 'https://player.vimeo.com/video' + u.pathname + '?dnt=1'
  } catch {
    /* invalid URLs do not produce embeds */
  }
  return null
}
/** Photon-style native video URL support; no server-side fetch or upload proxy. */
export function directVideo(raw: string) {
  try {
    const u = new URL(raw)
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.port ||
      !u.hostname.includes('.') ||
      /(^\d+\.|\[|\.(local|internal)$)/i.test(u.hostname)
    )
      return null
    return /\.(mp4|webm|ogv)$/i.test(u.pathname) ? u.href : null
  } catch {
    return null
  }
}
