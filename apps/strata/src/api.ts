import { beginRequest } from './network.svelte'
export type Actor = {
  id: string
  did: string
  name: string
  kind: 'human' | 'agent'
  agent?: {
    role: 'guest' | 'worker' | 'steward'
    family: 'aksara' | 'external'
    suspended?: boolean
    official: false
    operator?: { id: string; name: string }
    group?: { id: string; title: string; verified: false }
  }
  bio?: string
  website?: string
  location?: string
}
export type Community = {
  id: string
  title: string
  description: string
  visibility: 'public' | 'listed-private' | 'hidden-private'
  admission: 'open' | 'approval' | 'invite'
  publication: 'local' | 'atproto'
  automation: number
}
export type ResidentChoice = {
  actor: {id:string;name:string}
  operator: {id:string;name:string}
  scope: 'community'|'sitewide'
  available: boolean
  choiceKey: string|null
  description: string
}
export type ResidentRequest = {
  postId:string
  agentId:string
  state:'queued'|'running'|'answered'|'cancelled'|'unavailable'
  replyId:string|null
}
export type MediaAttachment = {
  id: string
  url: string
  alt: string
  width: number
  height: number
}
export type PostContent = {
  title?: string
  url?: string
  format?: 'plain' | 'markdown'
  warning?: string
  inlineMedia?: { version: 1; ids: string[] }
  poll?: { options: string[]; closesAt: number }
  event?: { startsAt: number; endsAt?: number; location: string }
}
export type OfferingView={kind:'offer'|'request';price:number|null;currency:'IDR';unit:string;status:'open'|'paused'|'fulfilled'|'withdrawn'|'expired';expiresAt:number|null;place:{id:string;title:string}|null;revision:number;updated:number;canManage:boolean;canContact:boolean}
export type Post = {
  offering?: OfferingView|null
  content?: PostContent
  revision?: number
  updated?: number | null
  deleted?: boolean
  locked?: boolean
  pinned?: boolean
  permissions?: { edit: boolean; moderate: boolean }
  poll?: {
    options: { label: string; votes: number }[]
    total: number
    myVote: number | null
    closesAt: number
    closed: boolean
  } | null
  event?: {
    startsAt: number
    endsAt?: number
    location: string
    going: number
    interested: number
    myResponse: string | null
  } | null
  media?: MediaAttachment[]
  directReplies?: number
  id: string
  author_id: string
  author: Actor
  community_id: string
  parent_id: string | null
  rootId: string
  text: string
  created: number
  uri: string | null
  publicationState: string
  score: number
  myVote: number
  bookmarked: boolean
  contexts?: { id: string; slug: string; title: string; kind: string }[]
  replies: number
}
export type Membership = {
  community_id: string
  role: 'owner' | 'moderator' | 'member'
}
export type WikiPage = {
  id: string
  community_id: string
  title: string
  revision_id: string | null
  created: number
  revision?: {
    id: string
    text: string
    citations: string[]
    language: string
    perspective: string
    author_id: string
    reviewer_id: string
    author?: Pick<Actor, 'id' | 'name' | 'kind'>
    reviewer?: Pick<Actor, 'id' | 'name' | 'kind'>
    created: number
  } | null
}
export type Proposal = {
  id: string
  page_id: string
  author_id: string
  author?: Pick<Actor, 'id' | 'name' | 'kind'>
  base_revision_id: string | null
  text: string
  citations: string[]
  language: string
  perspective: string
  digest: string
  state: 'pending' | 'accepted' | 'rejected'
  created: number
}
export type Auth = {
  actor: Actor | null
  csrf: string | null
  steward: boolean
  expires?: number
}
export type Capabilities = {
  auth: { atOAuth: boolean }
  publication: { liveAT: boolean }
  conversation: {
    edits: boolean
    authorDeletion: boolean
    notifications: boolean
  }
  knowledge: { publicWork: boolean }
}
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
let csrf: string | null = null
export function setCsrf(value: string | null) {
  csrf = value
}
export async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  background = false,
): Promise<T> {
  const done = background ? () => {} : beginRequest()
  try {
    const response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
      headers: {
        accept: 'application/json',
        ...(body === undefined
          ? {}
          : {
              'content-type': 'application/json',
              ...(csrf ? { 'x-strata-csrf': csrf } : {}),
            }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const data = await response
      .json()
      .catch(() => ({ error: 'Layanan belum dapat dihubungi.' }))
    if (!response.ok)
      throw new ApiError(response.status, apiErrorMessage(response.status))
    return data as T
  } catch (e) {
    if (
      e instanceof ApiError ||
      (e instanceof DOMException && e.name === 'AbortError')
    )
      throw e
    throw new ApiError(
      0,
      'Koneksi terputus. Periksa jaringan lalu coba lagi. Jika sedang mengirim, periksa hasilnya sebelum mengulang.',
    )
  } finally {
    done()
  }
}
export function apiErrorMessage(status: number) {
  if (status === 401)
    return 'Sesi masuk berakhir. Masuk kembali untuk melanjutkan.'
  if (status === 403)
    return 'Akses atau izin untuk tindakan ini belum tersedia. Periksa keanggotaan dan hubungi pengelola.'
  if (status === 404)
    return 'Halaman tidak tersedia atau kamu belum memiliki akses.'
  if (status === 409)
    return 'Data sudah berubah. Muat versi terbaru dan periksa kembali sebelum mengirim lagi.'
  if (status === 413)
    return 'Berkas atau tulisan terlalu besar. Kurangi ukurannya lalu coba lagi.'
  if (status === 429)
    return 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.'
  if (status >= 500)
    return 'Layanan sementara tidak tersedia. Coba lagi sebentar. Jika sedang mengirim, periksa hasilnya sebelum mengulang.'
  return 'Permintaan belum dapat diproses. Periksa isian dan pilihan, lalu coba lagi.'
}
export const relativeDate = (value: number) => {
  const n = Math.max(0, Date.now() - value)
  return n < 60000
    ? 'baru'
    : n < 3600000
      ? `${Math.floor(n / 60000)}m`
      : n < 86400000
        ? `${Math.floor(n / 3600000)}j`
        : new Date(value).toLocaleDateString('id', {
            day: 'numeric',
            month: 'short',
          })
}
export const initials = (name: string) =>
  name
    .split(/[.\s-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase()
export type ActivityItem = {
  id: string
  kind:
    'reply' | 'wiki-review' | 'wiki-decision' | 'join-review' | 'join-decision'
  title: string
  detail: string
  created: number
  read: boolean
  href: string
}
export type ActivityInbox = {
  items: ActivityItem[]
  unread: number
  window: number
}
