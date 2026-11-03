/** Drafts stay in this tab, scoped to the current account, with a 24h expiry.
 * No cookies/credentials or protected source files are stored here. */
export type WikiDraft = {
  page: string
  community: string
  base: string | null
  text: string
  title: string
  citations: string
  language: string
  perspective: string
  requestKey: string
  saved: number
}
const prefix = 'etnos.wiki-draft.v1:'
const key = (actor: string, page: string) => prefix + actor + ':' + page
export function readWikiDraft(actor: string, page: string): WikiDraft | null {
  try {
    const raw = sessionStorage.getItem(key(actor, page))
    if (!raw || raw.length > 100000) return null
    const d = JSON.parse(raw)
    if (
      d.page !== page ||
      !Number.isFinite(d.saved) ||
      Date.now() - d.saved > 86400000 ||
      d.saved > Date.now() + 60000 ||
      ![
        'community',
        'text',
        'title',
        'citations',
        'language',
        'perspective',
        'requestKey',
      ].every((k) => typeof d[k] === 'string') ||
      !(d.base === null || typeof d.base === 'string')
    ) {
      sessionStorage.removeItem(key(actor, page))
      return null
    }
    return d
  } catch {
    return null
  }
}
export function saveWikiDraft(actor: string, draft: WikiDraft): boolean {
  try {
    sessionStorage.setItem(key(actor, draft.page), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}
export function removeWikiDraft(actor: string, page: string) {
  try {
    sessionStorage.removeItem(key(actor, page))
  } catch {
    /* Optional local storage. */
  }
}
export function clearWikiDrafts(actor: string) {
  try {
    for (const k of Object.keys(sessionStorage))
      if (k.startsWith(prefix + actor + ':')) sessionStorage.removeItem(k)
  } catch {
    /* Optional local storage. */
  }
}
