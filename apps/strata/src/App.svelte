<script lang="ts">
  import {avatarTone} from './avatar-tone'
  import NotificationHost from './NotificationHost.svelte'
  import { notify, notifyError, dismissNotifications } from './notifications.svelte'
  import { tabScroll } from './tab-scroll'
  import { onMount, tick, untrack } from 'svelte'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import {
    Bookmark,
    BookOpen,
    X,
    Plus,
    ArrowUpRight,
    Share2,
    Send,
    Globe,
    LockKeyhole,
    ShieldCheck,
    RefreshCw,
    LoaderCircle,
    MessageCircle,
    MessagesSquare,
    ChevronRight,
    LogOut,
    MapPin,
    Link,
  } from '@lucide/svelte'
  import DiscoveryPage from './DiscoveryPage.svelte'
  import CommunityDirectory from './CommunityDirectory.svelte'
  import RouteProgress from './RouteProgress.svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import FeedRefresh from './FeedRefresh.svelte'
  import NewsSection from './NewsSection.svelte'
  import VaultTransfer from './messaging/VaultTransfer.svelte'
  import SearchDialog from './SearchDialog.svelte'
  import SearchPage from './SearchPage.svelte'
  import ThreadView from './ThreadView.svelte'
  import PostComposer from './PostComposer.svelte'
  import PostCard from './PostCard.svelte'
  import PlatformShell from './PlatformShell.svelte'
  import SpacesLab from './SpacesLab.svelte'
  import ActivityPage from './ActivityPage.svelte'
  import AppearancePanel from './AppearancePanel.svelte'
  import WelcomeDialog from './WelcomeDialog.svelte'
  import LandscapePrint from './LandscapePrint.svelte'
  import ThreadEnd from './ThreadEnd.svelte'
  import { profileArtwork } from './site-branding'
  import { hasSeenWelcome, rememberWelcome, safeBrowsePath, hasBootedThisSession, rememberBoot } from './welcome'
  import FeaturePages from './FeaturePages.svelte'
  import { videoEmbed, directVideo } from './markdown'
  import {
    applyAppearance,
    restoreAppearance,
    startAppearanceClock,
  } from './appearance.svelte'
  import {
    readWikiDraft,
    saveWikiDraft,
    removeWikiDraft,
    clearWikiDrafts,
  } from './wiki-drafts'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import Choice from './Choice.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import {
    request,
    setCsrf,
    ApiError,
    initials,
    type Actor,
    type Community,
    type Post,
    type Membership,
    type WikiPage,
    type Proposal,
    type Auth,
    type Capabilities,
    type ActivityInbox,
  } from './api'
  let searchQuery = $state(''),
    searchDialogOpen = $state(false),
    profileTab = $state('posts'),
    composeUrl = $state(''),
    composeKind = $state(''),
    profile = $state<Actor | null>(null)
  const firstWelcome = location.pathname === '/' && !hasSeenWelcome()
  const initialBoot = location.pathname === '/' && (firstWelcome || !hasBootedThisSession())
  let bootExitTimer: ReturnType<typeof setTimeout> | undefined
  let authDialogOpen = $state(location.pathname === '/login' || initialBoot),
    authDialogMode = $state<'welcome' | 'login' | 'signup'>(initialBoot ? 'welcome' : new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login'),
    authSearch = $state(location.pathname === '/login' ? location.search : ''),
    authDialogError = $state(''),
    welcomeIntro = $state(initialBoot),
    authDialogLeaving = $state(false)
  let path = $state(['/board', '/login'].includes(location.pathname) ? '/' : location.pathname),
    search = $state(location.pathname === '/login' ? '' : location.search),
    loading = $state(true),
    busy = $state(false),
    error = $state('')
  let auth = $state<Auth>({ actor: null, csrf: null, steward: false }),
    cap = $state<Capabilities | null>(null)
  let communities = $state<Community[]>([]),
    posts = $state<Post[]>([]),
    memberships = $state<Membership[]>([]),
    wiki = $state<WikiPage[]>([]),
    saved = $state<Post[]>([]),
    nextCursor = $state<string | null>(null)
  let following = $state<Actor[]>([])
  let selectedPost = $state<Post | null>(null),
    replies = $state<Post[]>([]),
    repliesCursor = $state<string | null>(null),
    selectedPage = $state<WikiPage | null>(null),
    proposals = $state<Proposal[]>([]),
    history = $state<
      { id: string; created: number; perspective: string; language: string }[]
    >([])
  let tab = $state('discussion'),
    feedTab = $state<'new' | 'mine' | 'following'>('new'),
    handle = $state(''),
    publishingConsent = $state(false),
    inviteHandle = $state('')
  let contextHeading = $state<{ path: string; kind: string } | null>(null)
  let modal = $state<
    null | 'compose' | 'community' | 'wiki' | 'proposal' | 'manage' | 'join'
  >(null)
  let composerApi = $state<PostComposer | null>(null)
  let wikiRequestKey = $state('')
  let composeState = $state({ dirty: false, busy: false, canSubmit: false }),
    discardDraft = $state(false)
  function closeModal() {
    if (modal === 'wiki' || modal === 'proposal') {
      if (busy) return
      if (wikiDirty) {
        discardDraft = true
        return
      }
    }
    if (modal === 'compose') {
      if (composeState.busy) return
      if (composeState.dirty) {
        discardDraft = true
        return
      }
    }
    modal = null
  }
  let text = $state(''),
    title = $state(''),
    description = $state(''),
    visibility = $state<Community['visibility'] | ''>(''),
    communityId = $state(''),
    citations = $state(''),
    language = $state('id'),
    perspective = $state(''),
    modalError = $state('')
  let wikiDraftPage = $state(''),
    wikiDraftOwner = $state(''),
    wikiBase = $state<string | null>(null),
    wikiBaseline = $state(''),
    wikiDraftStatus = $state(''),
    wikiRestored = $state(false)
  const wikiSignature = $derived(
    JSON.stringify({
      text,
      title,
      citations,
      language,
      perspective,
      communityId,
    }),
  )
  const wikiDirty = $derived(
    (modal === 'wiki' || modal === 'proposal') &&
      wikiSignature !== wikiBaseline,
  )
  const wikiConflict = $derived(
    modal === 'proposal' && wikiBase !== selectedPage?.revision_id,
  )
  $effect(() => {
    if (
      (modal === 'wiki' || modal === 'proposal') &&
      wikiDirty &&
      wikiDraftOwner &&
      wikiDraftOwner === auth.actor?.id
    ) {
      const draft = {
        page: wikiDraftPage,
        community: communityId,
        base: wikiBase,
        text,
        title,
        citations,
        language,
        perspective,
        requestKey: wikiRequestKey,
        saved: Date.now(),
      }
      wikiDraftStatus = saveWikiDraft(wikiDraftOwner, draft)
        ? 'Draf tersimpan di tab ini · 24 jam'
        : 'Penyimpanan tab tidak tersedia. Tetap di halaman ini agar draf tidak hilang.'
    }
  })
  let previousDraftActor: string | undefined
  $effect(() => {
    const current = auth.actor?.id
    if (previousDraftActor && previousDraftActor !== current) {
      clearWikiDrafts(previousDraftActor)
      untrack(() => {
        if (modal === 'wiki' || modal === 'proposal') modal = null
      })
    }
    previousDraftActor = current
  })
  function forgetWikiDraft() {
    if (wikiDraftOwner && wikiDraftPage)
      removeWikiDraft(wikiDraftOwner, wikiDraftPage)
  }
  let joinRequests = $state<
      { actor_id: string; message: string; state: string }[]
    >([]),
    reports = $state<
      { id: string; post_id: string; reason: string; state: string }[]
    >([])
  let moderation = $state<{
    posts: {
      id: string
      text: string
      hidden: number
      locked: number
      pinned: number
    }[]
    events: {
      post_id: string
      action: string
      reason: string
      created: number
    }[]
  }>({ posts: [], events: [] })
  let unread = $state(0)
  let generation = 0
  const parts = $derived(path.split('/').filter(Boolean)),
    community = $derived(communities.find((c) => c.id === parts[1])),
    isMember = (id: string) => memberships.some((m) => m.community_id === id)
  const isSteward = (id: string) =>
    memberships.some(
      (m) => m.community_id === id && ['owner', 'moderator'].includes(m.role),
    )
  const currentMembership = $derived(
    community
      ? memberships.find((m) => m.community_id === community.id)
      : undefined,
  )
  const displayPosts = $derived(
    path === '/saved'
      ? saved
      : feedTab === 'mine'
        ? posts.filter((p) => isMember(p.community_id))
        : posts,
  )
  const heading = $derived(
    parts[0] === 'studio'
      ? 'Studio'
      : parts[0] === 'knowledge'
        ? 'Catatan bersama'
        : parts[0] === 'agents'
      ? 'Agen & koneksi'
      : parts[0] === 'voices'
        ? 'Suara komunitas'
        : parts[0] === 'news'
          ? 'Kabar'
          : path === '/'
            ? 'Beranda'
            : parts[0] === 'explore'
              ? 'Jelajah'
              : parts[0] === 'communities'
                ? (community?.title ?? 'Komunitas')
                : parts[0] === 'wiki'
                  ? 'Wiki'
                  : parts[0] === 'saved'
                    ? 'Tersimpan'
                    : parts[0] === 'preferences'
                      ? 'Pengaturan'
                      : parts[0] === 'login'
                        ? 'Masuk'
                        : parts[0] === 'find'
                          ? 'Cari'
                          : parts[0] === 'square'
                            ? 'Percakapan'
                            : parts[0] === 'people'
                              ? 'Profil'
                              : parts[0] === 'messages'
                                ? 'Pesan'
                                : parts[0] === 'notifications'
                                  ? 'Aktivitas'
                                  : parts[0] === 'groups'
                                    ? 'Organisasi'
                                    : parts[0] === 'work'
                                      ? 'Kerja publik'
                                      : parts[0] === 'topics'
                                        ? 'Topik'
                                        : parts[0] === 'contexts'
                                          ? contextHeading?.path === path &&
                                            contextHeading.kind === 'topic'
                                            ? 'Topik'
                                            : 'Tempat & bahasa'
                                          : 'ETNOS',
  )
  function fail(value: unknown) {
    notifyError(value)
  }
  function saveScroll() {
    window.history.replaceState(
      {
        ...window.history.state,
        etnosScroll: window.scrollY,
        etnosTab: tab,
        etnosProfileTab: profileTab,
        etnosFeed: feedTab,
      },
      '',
    )
  }
  function goBack() {
    saveScroll()
    if (window.history.state?.etnosDepth > 0) window.history.back()
    else navigate('/')
  }
  function navigate(href: string) {
    const u = new URL(href, location.origin)
    if (u.pathname === '/board') u.pathname = '/'
    if (
      u.pathname === '/login' &&
      path !== '/login' &&
      !u.searchParams.has('returnTo')
    )
      u.searchParams.set('returnTo', path + search)
    if (u.pathname === '/login') {
      saveScroll()
      window.history.pushState({ ...window.history.state, etnosAuthDialog: true }, '', u)
      authSearch = u.search
      authDialogError = ''
      authDialogLeaving = false
      authDialogMode = u.searchParams.get('mode') === 'signup' ? 'signup' : 'login'
      welcomeIntro = false
      authDialogOpen = true
      return
    }
    authDialogOpen = false
    saveScroll()
    window.history.pushState(
      {
        etnosDepth: (window.history.state?.etnosDepth ?? 0) + 1,
        etnosScroll: 0,
      },
      '',
      u,
    )
    path = u.pathname
    search = u.search
    tab = 'discussion'
    profileTab = 'posts'
    void load()
    document.getElementById('commons-main')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function closeAuth() {
    if (busy) return
    rememberWelcome()
    clearTimeout(bootExitTimer)
    authDialogLeaving = false
    authDialogOpen = false
    if (location.pathname !== '/login') return
    if (window.history.state?.etnosAuthDialog) window.history.back()
    else {
      const target = safeBrowsePath(new URLSearchParams(authSearch).get('returnTo'))
      window.history.replaceState({ ...window.history.state, etnosAuthDialog: false }, '', target)
      void restoreEntry()
    }
  }
  async function restoreEntry() {
    const entry = location.href,
      top = window.history.state?.etnosScroll ?? 0
    if (location.pathname === '/board')
      window.history.replaceState(
        window.history.state,
        '',
        '/' + location.search,
      )
    path = location.pathname
    search = location.search
    tab = window.history.state?.etnosTab ?? 'discussion'
    profileTab = window.history.state?.etnosProfileTab ?? 'posts'
    feedTab = window.history.state?.etnosFeed ?? 'new'
    await load()
    await tick()
    let pages = 0
    while (
      location.href === entry &&
      nextCursor &&
      top > document.documentElement.scrollHeight - innerHeight &&
      pages++ < 5
    ) {
      await more()
      await tick()
    }
    if (location.href === entry)
      requestAnimationFrame(() => window.scrollTo({ top, behavior: 'instant' }))
  }
  function intercept(e: MouseEvent) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
      return
    const a = e.target instanceof Element ? e.target.closest('a') : null
    if (!a || a.target || a.hasAttribute('download')) return
    const u = new URL(a.href, location.href)
    if (
      u.origin !== location.origin ||
      u.pathname.startsWith('/auth/') ||
      u.pathname.startsWith('/oauth/')
    )
      return
    if (
      u.pathname === location.pathname &&
      u.search === location.search &&
      u.hash
    )
      return
    e.preventDefault()
    navigate(u.pathname + u.search + u.hash)
  }
  async function load() {
    const mine = ++generation
    loading = true
    error = ''
    try {
      const identity = await request<Auth>('/auth/me')
      if (mine !== generation) return
      auth = identity
      if (authDialogOpen && authDialogMode === 'welcome') {
        rememberWelcome()
      }
      setCsrf(identity.csrf)
      profile = null
      const filters = new SvelteURLSearchParams({ roots: 'true', limit: '30' })
      if (parts[0] === 'communities' && parts[1])
        filters.set('community', parts[1])
      if (path === '/' && feedTab === 'following' && identity.actor)
        filters.set('following', 'true')
      if (parts[0] === 'people' && parts[1]) {
        filters.set('author', parts[1])
        filters.set('roots', 'false')
      }
      if (parts[0] === 'find')
        filters.set('q', new SvelteURLSearchParams(search).get('q') ?? '')
      const [cs, feed, pages, roles, features, followed] = await Promise.all([
        request<Community[]>('/v1/communities'),
        ['news','studio','knowledge'].includes(parts[0])
          ? Promise.resolve({
              items: [] as Post[],
              pinned: [] as Post[],
              nextCursor: null,
            })
          : request<{
              items: Post[]
              pinned?: Post[]
              nextCursor: string | null
            }>('/v1/feed/page?' + filters),
        ['news','studio','knowledge'].includes(parts[0])
          ? Promise.resolve([])
          : request<WikiPage[]>('/v1/wiki'),
        identity.actor
          ? request<Membership[]>('/v1/memberships')
          : Promise.resolve([]),
        request<Capabilities>('/v1/capabilities'),
        identity.actor
          ? request<Actor[]>('/v1/following')
          : Promise.resolve([]),
      ])
      if (mine !== generation) return
      communities = cs
      posts = [
        ...(feed.pinned ?? []),
        ...feed.items.filter(
          (p) => !feed.pinned?.some((pin) => pin.id === p.id),
        ),
      ]
      wiki = pages
      memberships = roles
      cap = features
      following = followed
      nextCursor = feed.nextCursor
      unread = identity.actor
        ? (await request<ActivityInbox>('/v1/notifications')).unread
        : 0
      if (mine !== generation) return
      selectedPost = null
      replies = []
      selectedPage = null
      proposals = []
      history = []
      if (parts[0] === 'people' && parts[1]) {
        const actor = await request<Actor>('/v1/actors/' + parts[1])
        if (mine === generation) profile = actor
      }
      if (path === '/saved' && identity.actor) {
        const rows = await request<Post[]>('/v1/bookmarks')
        if (mine === generation) saved = rows
      } else saved = []
      if (parts[0] === 'square' && parts[1]) {
        const p = await request<Post>('/v1/posts/' + parts[1])
        const thread = await request<{
          items: Post[]
          nextCursor: string | null
        }>('/v1/posts/' + p.id + '/replies')
        if (mine !== generation) return
        selectedPost = p
        replies = thread.items
        repliesCursor = thread.nextCursor
      }
      if (parts[0] === 'wiki' && parts[1]) {
        const p = await request<WikiPage>('/v1/wiki/' + parts[1])
        const h = await request<typeof history>('/v1/wiki/' + p.id + '/history')
        if (mine !== generation) return
        selectedPage = p
        history = h
        if (
          identity.actor &&
          roles.some((m) => m.community_id === p.community_id)
        ) {
          const drafts = await request<Proposal[]>(
            '/v1/wiki/' + p.id + '/proposals',
          )
          if (mine === generation) proposals = drafts
        }
      }
    } catch (e) {
      if (mine === generation) {
        error = e instanceof Error ? e.message : 'Belum dapat memuat halaman.'
        if (e instanceof ApiError && e.status === 401) {
          auth = { actor: null, csrf: null, steward: false }
          setCsrf(null)
          communities = []
          posts = []
          memberships = []
          saved = []
        }
      }
    } finally {
      if (mine === generation) {
        loading = false
        if (authDialogOpen && authDialogMode === 'welcome' && (auth.actor || !firstWelcome)) {
          authDialogLeaving = true
          bootExitTimer = setTimeout(() => {
            authDialogOpen = false
            authDialogLeaving = false
          }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220)
        }
      }
    }
  }
  async function mutate(action: () => Promise<void>) {
    if (busy) return
    busy = true
    try {
      await action()
    } catch (e) {
      fail(e)
    } finally {
      busy = false
    }
  }
  function open(kind: typeof modal, id = '') {
    if (!auth.actor) {
      navigate('/login')
      return
    }
    composeState = { dirty: false, busy: false, canSubmit: false }
    composeUrl = ''
    composeKind = ''
    modal = kind
    wikiRequestKey = crypto.randomUUID()
    communityId = id || memberships[0]?.community_id || communities[0]?.id || ''
    text = ''
    title = ''
    description = ''
    citations = ''
    perspective = auth.actor?.name ?? ''
    modalError = ''
    visibility = ''
    if (kind === 'wiki' || kind === 'proposal') {
      wikiDraftOwner = auth.actor.id
      wikiDraftPage = kind === 'proposal' ? selectedPage!.id : 'new'
      wikiBase =
        kind === 'proposal' ? (selectedPage?.revision_id ?? null) : null
      if (kind === 'proposal') {
        communityId = selectedPage!.community_id
        text = selectedPage?.revision?.text ?? ''
        language = selectedPage?.revision?.language ?? 'id'
        citations = selectedPage?.revision?.citations.join('\n') ?? ''
      }
      wikiBaseline = JSON.stringify({
        text,
        title,
        citations,
        language,
        perspective,
        communityId,
      })
      wikiRestored = false
      wikiDraftStatus = ''
      const draft = readWikiDraft(wikiDraftOwner, wikiDraftPage)
      if (
        draft &&
        communities.some(
          (c) =>
            c.id === draft.community &&
            c.visibility === 'public' &&
            isMember(c.id),
        )
      ) {
        communityId = draft.community
        wikiBase = draft.base
        text = draft.text
        title = draft.title
        citations = draft.citations
        language = draft.language
        perspective = draft.perspective
        wikiRequestKey = draft.requestKey
        wikiRestored = true
      }
    }
    if (kind === 'manage') void manage(id)
  }
  async function manage(id: string) {
    try {
      ;[joinRequests, reports, moderation] = await Promise.all([
        request<typeof joinRequests>(`/v1/communities/${id}/requests`),
        request<typeof reports>(`/v1/communities/${id}/reports`),
        request<typeof moderation>(`/v1/communities/${id}/moderation`),
      ])
    } catch (e) {
      modalError =
        e instanceof Error ? e.message : 'Belum dapat memuat antrean.'
    }
  }
  async function submit() {
    if (busy) return
    busy = true
    modalError = ''
    try {
      if (modal === 'compose') {
        const p = await request<Post>('/v1/posts', { communityId, text })
        modal = null
        navigate('/square/' + p.id)
      } else if (modal === 'community') {
        if (!visibility) return
        const c = await request<Community>('/v1/communities', {
          title,
          description,
          visibility,
          admission: visibility === 'public' ? 'approval' : 'invite',
        })
        modal = null
        navigate('/communities/' + c.id)
      } else if (modal === 'join') {
        await request(`/v1/communities/${communityId}/requests`, {
          message: text,
        })
        modal = null
        notify('Permintaan bergabung dikirim.')
      } else if (modal === 'wiki') {
        const p = await request<WikiPage>(
          `/v1/communities/${communityId}/wiki`,
          {
            title,
            requestKey: wikiRequestKey,
            draft: {
              text,
              citations: citations
                .split('\n')
                .map((x) => x.trim())
                .filter(Boolean),
              language,
              perspective:
                perspective || auth.actor?.name || 'Kontribusi komunitas',
            },
          },
        )
        forgetWikiDraft()
        modal = null
        navigate('/wiki/' + p.id)
      } else if (modal === 'proposal' && selectedPage) {
        if (wikiConflict)
          throw Error(
            'Revisi berubah. Bandingkan draf dengan halaman terbaru sebelum mengirim.',
          )
        await request(`/v1/wiki/${selectedPage.id}/proposals`, {
          baseRevision: wikiBase,
          text,
          citations: citations
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
          language,
          perspective,
        })
        forgetWikiDraft()
        modal = null
        await load()
        notify('Usulan dikirim untuk ditinjau.')
      }
    } catch (e) {
      modalError =
        e instanceof Error
          ? e.message
          : 'Status belum pasti. Muat ulang sebelum mencoba lagi.'
    } finally {
      busy = false
    }
  }
  async function login(mode: 'login' | 'signup' = 'login', invitation = '') {
    authDialogError = ''
    await mutate(async () => {
      try {
      const result = await request<{ authorizationUrl: string }>(
        '/auth/start',
        {
          mode,
          ...(mode === 'signup'
            ? { invitation }
            : { handle: handle.trim(), publishing: publishingConsent }),
          returnTo:
            new SvelteURLSearchParams(authSearch).get('returnTo') ||
            (mode === 'signup' ? '/communities?welcome=1' : '/'),
        },
      )
      location.assign(result.authorizationUrl)
      } catch (e) {
        authDialogError = e instanceof Error ? e.message : 'Masuk belum dapat dilanjutkan. Coba lagi.'
        throw e
      }
    })
  }
  async function logout() {
    if (auth.actor) clearWikiDrafts(auth.actor.id)
    await mutate(async () => {
      generation++
      posts = []
      saved = []
      communities = []
      memberships = []
      selectedPage = null
      proposals = []
      replies = []
      selectedPost = null
      await request('/auth/logout', {})
      auth = { actor: null, csrf: null, steward: false }
      dismissNotifications()
      setCsrf(null)
      navigate('/')
    })
  }
  async function more() {
    if (!nextCursor || busy) return
    await mutate(async () => {
      const q = new SvelteURLSearchParams({
        roots: 'true',
        limit: '30',
        cursor: nextCursor!,
      })
      if (community) q.set('community', community.id)
      if (parts[0] === 'people' && parts[1]) {
        q.set('author', parts[1])
        q.set('roots', 'false')
      }
      if (path === '/' && feedTab === 'following') q.set('following', 'true')
      const page = await request<{ items: Post[]; nextCursor: string | null }>(
        '/v1/feed/page?' + q,
      )
      posts = [
        ...posts,
        ...page.items.filter(
          (p) => !posts.some((existing) => existing.id === p.id),
        ),
      ]
      nextCursor = page.nextCursor
    })
  }
  async function decide(p: Proposal, accept: boolean) {
    await mutate(async () => {
      await request(`/v1/wiki-proposals/${p.id}/decide`, {
        digest: p.digest,
        accept,
      })
      await load()
      notify(accept ? 'Revisi diterima.' : 'Usulan ditolak.')
    })
  }
  $effect(() => {
    applyAppearance()
  })
  onMount(() => {
    if (initialBoot) rememberBoot()
    try {
      localStorage.removeItem('etnos-home-layout')
      localStorage.removeItem('etnos-feed-board')
    } catch {
      /* Optional old layout storage. */
    }
    if (location.pathname === '/board')
      window.history.replaceState(
        window.history.state,
        '',
        '/' + location.search,
      )
    restoreAppearance()
    const stopClock = startAppearanceClock()
    window.history.scrollRestoration = 'manual'
    window.history.replaceState({ etnosDepth: 0, ...window.history.state }, '')
    void load()
    return () => {
      dismissNotifications()
      clearTimeout(bootExitTimer)
      stopClock()
    }
  })
</script>

<svelte:head><title>{heading} · ETNOS</title></svelte:head>
<svelte:window
  onkeydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      searchDialogOpen = !searchDialogOpen
    }
  }}
  onclick={intercept}
  onpopstate={() => {
    if (modal === 'wiki' || modal === 'proposal') modal = null
    if (location.pathname === '/login') {
      authSearch = location.search
      authDialogMode = new URLSearchParams(authSearch).get('mode') === 'signup' ? 'signup' : 'login'
      welcomeIntro = false
      authDialogOpen = true
    } else {
      authDialogOpen = false
      void restoreEntry()
    }
  }}
  onbeforeunload={(event) => {
    if (wikiDirty || ((modal === 'wiki' || modal === 'proposal') && busy) || (modal === 'compose' && (composeState.dirty || composeState.busy)))
      event.preventDefault()
  }}
/>
<PlatformShell
  {path}
  {heading}
  {auth}
  {unread}
  onBack={goBack}
  onCompose={() => open('compose')}
  onRefresh={() => load()}
  feedMode={feedTab}
  onFeedChange={(mode) => {
    if (mode === 'following' && !auth.actor) {
      navigate('/login')
      return
    }
    feedTab = mode
    void load()
  }}
  onSearch={(q) => {
    searchQuery = q
    searchDialogOpen = true
  }}
>
  <RouteProgress />
  {#if loading && !posts.length && !selectedPost && !['messages', 'notifications', 'groups', 'work', 'contexts', 'topics', 'explore', 'news', 'login', 'wiki'].includes(parts[0])}<ContentSkeleton
    />{/if}
  {#if path === '/recover-messages'}<VaultTransfer recovery />
  {:else if error}<div class="strata-card">
      <p class="strata-alert" role="alert">{error}</p>
      <Button
        class="cx-button small"
        style="margin-top:14px"
        onclick={() => load()}
        type="button"
        variant="outline"
      >
        <RefreshCw size={14} />Coba lagi
      </Button>
    </div>
  {:else if parts[0] === 'news' && parts[1]}{#await import('./NewsPage.svelte')}<ContentSkeleton
      />{:then { default: NewsPage }}<NewsPage
        id={parts[1]}
        {auth}
        {communities}
        {memberships}
        onError={fail}
        onShare={(url) => {
          open('compose')
          composeUrl = url
        }}
      />{/await}
  {:else if path === '/voices'}{#await import('./EngagementPage.svelte') then module}<module.default
        {auth}
        onAsk={() => {
          open('compose')
          composeKind = 'poll'
        }}
      />{/await}
  {:else if path === '/news'}{#await import('./NewsIndex.svelte') then module}<module.default
        {search}
        {navigate}
      />{/await}
  {:else if path === '/labs/spaces'}<SpacesLab />
  {:else if parts[0] === 'knowledge'}
    {#await import('./KnowledgePage.svelte') then module}<module.default {auth} {path} {navigate}/>{/await}
  {:else if path === '/studio'}
    {#await import('./StudioPage.svelte') then module}<module.default {auth}/>{/await}
  {:else if path === '/agents'}
    {#await import('./AgentConnections.svelte') then module}<module.default
        {auth}
      />{/await}
  {:else if path === '/preferences'}
    <div class="cx-page-head"><h1>Pengaturan</h1></div>
    <Card.Root class="strata-card strata-preferences">
      <AppearancePanel />
      <a class="cx-list-row" href="/studio">Studio komunitas <ChevronRight size={16}/></a>
      <a class="cx-list-row" href="/agents">
        Agen & koneksi <ChevronRight size={16} />
      </a>
      <VaultTransfer actorId={auth.actor?.id} />
      <a class="cx-list-row" href="/labs/spaces">
        AT Spaces · uji protokol alpha <ChevronRight size={16} />
      </a>
      {#if auth.actor}<div>
          <strong>{auth.actor.name}</strong>
          <p class="cx-hint" style="overflow-wrap:anywhere">
            {auth.actor.did}
          </p>
        </div>
        <p class="cx-hint">
          Akun tetap berada di PDS asal. Tidak ada migrasi akun.
        </p>
        <Button
          class="cx-button"
          disabled={busy}
          onclick={logout}
          type="button"
          variant="outline"
        >
          <LogOut size={16} />Keluar dari perangkat ini
        </Button>
        {#if auth.steward}<form
            class="cx-form"
            onsubmit={(e) => {
              e.preventDefault()
              mutate(async () => {
                await request('/auth/invite', { handle: inviteHandle })
                inviteHandle = ''
                notify(
                  'Akun dapat masuk. Keanggotaan komunitas tetap terpisah.',
                )
              })
            }}
          >
            <Label>
              Undang akun ke Strata
              <Input
                bind:value={inviteHandle}
                placeholder="nama.domain"
                required
              />
            </Label>
            <Button
              class="cx-button small"
              disabled={busy}
              type="submit"
              variant="outline"
            >
              Undang akun
            </Button>
          </form>{/if}{:else}<Button
          href="/login"
          class="cx-button primary"
          variant="default"
        >
          Masuk
        </Button>{/if}
    </Card.Root>
  {:else if parts[0] === 'messages'}
    {#await import('./MessagingPage.svelte') then module}<module.default
        {auth}
        {path}
        {search}
        {navigate}
      />{/await}
  {:else if path === '/explore'}
    <DiscoveryPage {auth} />
  {:else if path === '/find'}
    <SearchPage
      onSearch={(q) => {
        searchQuery = q
        searchDialogOpen = true
      }}
      query={new SvelteURLSearchParams(search).get('q') ?? ''}
    />
  {:else if path === '/notifications'}
    <ActivityPage
      {auth}
      {navigate}
      onError={fail}
      onUnread={(n) => (unread = n)}
    />
  {:else if path === '/groups' && !search.includes('create=true')}
    <CommunityDirectory
      {auth}
      {communities}
      {memberships}
      view="organizations"
      onCreate={() => open('community')}
      {navigate}
    />
  {:else if path === '/topics'}<CommunityDirectory
      {auth}
      {communities}
      {memberships}
      view="topics"
      onCreate={() => open('community')}
      {navigate}
    />
  {:else if path === '/contexts' && !search.includes('create=true')}
    <CommunityDirectory
      {auth}
      {communities}
      {memberships}
      view="places"
      onCreate={() => open('community')}
      {navigate}
    />
  {:else if ['groups', 'work', 'contexts', 'explore'].includes(parts[0])}
    <FeaturePages
      {path}
      {auth}
      onError={fail}
      {navigate}
      onContextResolved={(kind) => {
        contextHeading = { path, kind }
      }}
    />
  {:else if parts[0] === 'wiki'}
    {#if loading}<ContentSkeleton
      />{:else}{#await import('./WikiExperience.svelte')}<ContentSkeleton/>{:then module}<module.default
          page={selectedPage}
          pages={wiki}
          {proposals}
          {history}
          {communities}
          {memberships}
          {auth}
          {busy}
          onCreate={() => open('wiki')}
          onPropose={() => {
            open('proposal')
          }}
          onDecide={decide}
        />{/await}{/if}
  {:else if parts[0] === 'communities' && parts[1]}
    {#if community}<div class="cx-detail-head community-profile">
        <div class="cx-between">
          <span class="cx-avatar sage avatar-tinted" style={avatarTone(community.id)}>{initials(community.title)}</span>
          {#if currentMembership}<Badge variant="secondary">
              {currentMembership.role === 'member'
                ? 'Anggota'
                : currentMembership.role === 'owner'
                  ? 'Pemilik'
                  : 'Moderator'}
            </Badge>{:else if community.admission === 'open'}<Button
              class="cx-button small"
              disabled={busy}
              onclick={() =>
                mutate(async () => {
                  await request(`/v1/communities/${community.id}/join`, {})
                  await load()
                })}
              type="button"
              variant="outline"
            >
              Gabung
            </Button>{:else if community.admission === 'approval'}<Button
              class="cx-button small"
              onclick={() => open('join', community.id)}
              type="button"
              variant="outline"
            >
              Minta bergabung
            </Button>{:else}<Badge variant="secondary">
              Dengan undangan
            </Badge>{/if}
        </div>
        <h1>{community.title}</h1>
        <p>{community.description}</p>
        <div class="strata-caption">
          {#if community.visibility === 'public'}<Globe
              size={13}
            />Publik{:else}<LockKeyhole size={13} />Khusus anggota{/if}
          <span>·</span>
          {community.publication === 'atproto'
            ? 'Penerbitan AT tersedia'
            : 'Percakapan di Strata'}
        </div>
        <div class="cx-actions" style="margin-top:18px">
          {#if currentMembership}<Button
              class="cx-button primary small"
              onclick={() => open('compose', community.id)}
              type="button"
              variant="default"
            >
              <Plus size={14} />Posting
            </Button>{/if}{#if isSteward(community.id)}<Button
              class="cx-button small"
              onclick={() => open('manage', community.id)}
              type="button"
              variant="outline"
            >
              <ShieldCheck size={14} />Kelola
            </Button>{/if}
        </div>
      </div>
      <Tabs.Root bind:value={tab}>
        <div class="section-tab-scroll" use:tabScroll>
          <Tabs.List
            variant="line"
            class="page-tabs"
            aria-label="Isi komunitas"
          >
            <Tabs.Trigger value="discussion">Diskusi</Tabs.Trigger><Tabs.Trigger
              value="wiki"
            >
              Wiki
            </Tabs.Trigger><Tabs.Trigger value="media">
              Media
            </Tabs.Trigger><Tabs.Trigger value="voices">
              Suara
            </Tabs.Trigger><Tabs.Trigger value="about">Tentang</Tabs.Trigger>
          </Tabs.List>
        </div>
        <Tabs.Content value={tab}>
          {#if tab === 'voices'}{#await import('./EngagementPage.svelte') then module}<module.default
                {auth}
                communityId={community.id}
                onAsk={() => {
                  open('compose', community.id)
                  composeKind = 'poll'
                }}
              />{/await}{:else if tab === 'about'}<Card.Root
              class="strata-card"
            >
              <p class="strata-body">{community.description}</p>
              <p class="cx-hint">
                {community.visibility === 'public'
                  ? 'Isi dapat dibaca publik.'
                  : 'Isi hanya tersedia bagi anggota saat ini.'}
                {community.admission === 'approval'
                  ? 'Permintaan bergabung ditinjau pengelola.'
                  : community.admission === 'invite'
                    ? 'Keanggotaan melalui undangan.'
                    : 'Keanggotaan terbuka.'}
              </p>
            </Card.Root>{:else if tab === 'wiki'}<Card.Root class="strata-card">
              {#each wiki.filter((p) => p.community_id === community.id) as p}<a
                  href={'/wiki/' + p.id}
                  class="cx-list-row"
                >
                  <BookOpen size={18} />{p.title}<ChevronRight size={15} />
                </a>{/each}{#if isSteward(community.id) && community.visibility === 'public'}<Button
                  class="cx-button small"
                  onclick={() => open('wiki', community.id)}
                  type="button"
                  variant="outline"
                >
                  <Plus size={14} />Halaman baru
                </Button>{/if}
            </Card.Root>{:else}{#each posts.filter((p) => tab !== 'media' || p.media?.length || videoEmbed(p.content?.url ?? '') || directVideo(p.content?.url ?? '')) as p}<PostCard
                post={p}
                {community}
                loggedIn={!!auth.actor}
                canVote={!!currentMembership}
                onError={fail}
              />{/each}{#if nextCursor}<div class="profile-more">
                <Button variant="outline" disabled={busy} onclick={more}>
                  Muat posting lain
                </Button>
              </div>{/if}{#if !posts.filter((p) => tab !== 'media' || p.media?.length || videoEmbed(p.content?.url ?? '') || directVideo(p.content?.url ?? '')).length && !loading}<div
                class="strata-nodata"
              >
                <MessageCircle size={26} />
                <h2>
                  {tab === 'media'
                    ? 'Belum ada media yang dimuat'
                    : 'Belum ada percakapan'}
                </h2>
                <p>
                  {tab === 'media'
                    ? 'Gambar dan video dari percakapan muncul di sini.'
                    : currentMembership
                      ? 'Mulai percakapan pertama.'
                      : 'Gabung komunitas untuk ikut berbicara.'}
                </p>
              </div>{/if}{/if}
        </Tabs.Content>
      </Tabs.Root>
    {:else if !loading}<div class="strata-nodata">
        <LockKeyhole size={26} />
        <h2>Komunitas tidak tersedia</h2>
        <p>Komunitas mungkin tidak ada atau memerlukan akses.</p>
        <Button href="/communities" class="cx-button" variant="outline">
          Komunitas
        </Button>
      </div>{/if}
  {:else if path === '/communities'}
    {#if auth.actor && new SvelteURLSearchParams(search).get('welcome') === '1'}
      <div class="signup-welcome" role="status">
        <div>
          <strong>Selamat datang, {auth.actor.name}</strong>
          <p>Pilih komunitas untuk mulai ikut berbicara.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Tutup sambutan"
          onclick={() => navigate('/communities')}
        >
          <X size={16} />
        </Button>
      </div>
    {/if}
    <CommunityDirectory
      {auth}
      {communities}
      {memberships}
      view={new URLSearchParams(search).get('view') === 'joined'
        ? 'joined'
        : 'rooms'}
      onCreate={() => open('community')}
      {navigate}
    />
  {:else if parts[0] === 'square'}
    {#if selectedPost}<ThreadView
        post={selectedPost}
        {replies}
        cursor={repliesCursor}
        community={communities.find((c) => c.id === selectedPost!.community_id)}
        actor={auth.actor}
        member={isMember(selectedPost.community_id)}
        onError={fail}
        onRefresh={load}
        reviewRequested={new URLSearchParams(search).get('review') === 'wiki'}
        onWikiDraft={selectedPost &&
        isSteward(selectedPost.community_id) &&
        communities.some(
          (c) =>
            c.id === selectedPost!.community_id && c.visibility === 'public',
        )
          ? () => {
              open('wiki', selectedPost!.community_id)
              title =
                selectedPost!.content?.title || selectedPost!.text.slice(0, 80)
              text = selectedPost!.text
              citations = location.origin + '/square/' + selectedPost!.id
            }
          : undefined}
      />{:else if !loading}<div class="strata-nodata">
        <h2>Posting tidak tersedia</h2>
      </div>{/if}
  {:else if parts[0] === 'people'}
    {@const actor = profile}{#if actor}{@const profilePosts = posts.filter(
        (p) =>
          p.author.id === actor.id &&
          (profileTab === 'replies'
            ? !!p.parent_id
            : profileTab === 'media'
              ? !!(
                  p.media?.length ||
                  videoEmbed(p.content?.url ?? '') ||
                  directVideo(p.content?.url ?? '')
                )
              : !p.parent_id),
      )}
      <section class="profile-header">
        <div class="profile-cover" aria-hidden="true">{#if profileArtwork(actor.id)}<LandscapePrint artwork={profileArtwork(actor.id)!} decorative/>{/if}</div>
        <div class="profile-content">
          <div class="profile-topline">
            <span class="cx-avatar sage profile-avatar avatar-tinted" style={avatarTone(actor.id)}>
              {initials(actor.name)}
            </span>
            <div class="profile-actions">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Salin tautan profil"
                title="Salin tautan profil"
                onclick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      location.origin + '/people/' + actor.id,
                    )
                    notify('Tautan profil disalin.')
                  } catch {
                    notifyError('Tautan belum dapat disalin.')
                  }
                }}
              >
                <Share2 size={18} />
              </Button>
              {#if auth.actor?.id === actor.id && actor.kind === 'human'}{#await import('./ProfileEdit.svelte') then module}<module.default
                    {actor}
                    onSaved={(fields) => {
                      if (profile) profile = { ...profile, ...fields }
                    }}
                  />{/await}{/if}
              {#if auth.actor && auth.actor.id !== actor.id}<Button
                  variant={following.some((a) => a.id === actor.id)
                    ? 'outline'
                    : 'default'}
                  disabled={busy}
                  onclick={() =>
                    mutate(async () => {
                      const follow = !following.some((a) => a.id === actor.id)
                      await request('/v1/actors/' + actor.id + '/follow', {
                        following: follow,
                      })
                      following = follow
                        ? [...following, actor]
                        : following.filter((a) => a.id !== actor.id)
                    })}
                >
                  {following.some((a) => a.id === actor.id)
                    ? 'Mengikuti'
                    : 'Ikuti'}
                </Button>{/if}
              {#if auth.actor && auth.actor.id !== actor.id && actor.kind === 'human'}<Button
                  href={'/messages?to=' + actor.id}
                  variant="outline"
                  aria-label="Kirim pesan"
                >
                  <MessagesSquare size={17} />
                </Button>{/if}
            </div>
          </div>
          <div class="profile-intro">
            <h1>
              {actor.name.endsWith('.bsky.social')
                ? actor.name.slice(0, -12)
                : actor.name}
            </h1>
            <p class="profile-handle">
              {actor.name.includes('.')
                ? '@' + actor.name
                : actor.kind === 'agent'
                  ? actor.agent?.family === 'aksara'
                    ? 'Aksara · AI'
                    : 'Agen · AI'
                  : 'Anggota ETNOS'}
            </p>
          </div>
          {#if actor.bio}<p class="profile-bio">{actor.bio}</p>{:else if auth.actor?.id === actor.id && actor.kind === 'human'}<p class="profile-bio-hint">Tambahkan bio singkat lewat Edit profil.</p>{/if}
          {#if actor.website || actor.location}<div
              class="profile-public-fields"
            >
              {#if actor.location}<span>
                  <MapPin size={15} />{actor.location}
                </span>{/if}
              {#if actor.website}<a
                  href={actor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Link size={15} />{new URL(actor.website).hostname}
                </a>{/if}
            </div>{/if}
          <details class="profile-identity">
            <summary>Identitas AT</summary>
            <p class="cx-hint">{actor.did}</p>
          </details>
          {#if actor.kind === 'agent'}<Badge variant="secondary">
              Agen
            </Badge>{/if}
          {#if actor.agent}<p class="agent-attribution">
              {actor.agent.family === 'aksara'
                ? 'Aksara'
                : 'Agen tamu'}{#if actor.agent.operator}
                · Dikelola oleh <a href={'/people/' + actor.agent.operator.id}>
                  {actor.agent.operator.name}
                </a>{/if}{#if actor.agent.group}
                · <a href={'/groups/' + actor.agent.group.id}>
                  {actor.agent.group.title}
                </a>{/if}{#if actor.agent.suspended}
                · Dijeda{/if}
            </p>{/if}
        </div>
      </section>
      <div class="section-tab-scroll" use:tabScroll>
        <div class="profile-tabs" role="group" aria-label="Isi profil">
          {#each [['posts', 'Posting'], ['replies', 'Balasan'], ['media', 'Media']] as [value, label]}<button
              aria-pressed={profileTab === value}
              onclick={() => (profileTab = value)}
            >
              {label}
            </button>{/each}
        </div>
      </div>
      {#each profilePosts as p}<PostCard
          post={p}
          community={communities.find((c) => c.id === p.community_id)}
          loggedIn={!!auth.actor}
          canVote={isMember(p.community_id)}
          onError={fail}
        />{/each}
      {#if nextCursor}<div class="profile-more">
          <Button variant="outline" disabled={busy} onclick={more}>
            Muat posting lain
          </Button>
        </div>{/if}
      {#if !profilePosts.length && !loading}<p class="search-state">
          Belum ada posting yang dapat kamu lihat.
        </p>{/if}
      <ThreadEnd/>
    {:else if !loading}<div class="strata-nodata">
        <h2>Profil tidak tersedia</h2>
        <p>
          Identitas anggota privat tidak ditampilkan dalam direktori publik.
        </p>
      </div>{/if}
  {:else if path === '/' || path === '/saved' || path === '/find'}
    <FeedRefresh
      enabled={path === '/' && modal === null && !searchDialogOpen && !authDialogOpen}
      busy={loading}
      onRefresh={load}
    >
      {#if path === '/saved'}<div class="cx-page-head">
          <h1>Tersimpan</h1>
          <Bookmark size={18} />
        </div>{:else if path === '/find'}<div class="cx-page-head">
          <h1>Hasil pencarian</h1>
        </div>{:else}<h1 class="sr-only">Beranda</h1>
        <div class="cx-composer-bar">
          <span class="cx-avatar sage avatar-tinted" style={avatarTone(auth.actor?.id??'visitor')}>
            {auth.actor ? initials(auth.actor.name) : '+'}
          </span>
          <Button
            onclick={() => open('compose')}
            type="button"
            variant="outline"
          >
            Apa yang terjadi?
          </Button>
          <Button
            class="cx-button primary"
            onclick={() => open('compose')}
            type="button"
            variant="default"
          >
            Posting
          </Button>
        </div>{/if}
      {#each displayPosts as p}<PostCard
          post={p}
          community={communities.find((c) => c.id === p.community_id)}
          loggedIn={!!auth.actor}
          canVote={isMember(p.community_id)}
          onError={fail}
          onSaved={() => {
            if (path === '/saved') saved = saved.filter((x) => x.bookmarked)
          }}
        />{/each}
      {#if !displayPosts.length && !loading}<div class="strata-nodata">
          <div class="strata-empty-graphic">
            {#if path === '/saved'}<Bookmark size={27} />{:else}<MessageCircle
                size={27}
              />{/if}
          </div>
          <h2>
            {path === '/saved'
              ? 'Simpan untuk nanti'
              : path === '/find'
                ? 'Belum ada hasil'
                : feedTab === 'following'
                  ? 'Ikuti percakapan mereka'
                  : 'Belum ada percakapan'}
          </h2>
          <p>
            {path === '/saved'
              ? 'Posting yang kamu simpan tersedia selama kamu memiliki akses.'
              : feedTab === 'following'
                ? 'Cari peserta dan pilih Ikuti di profil mereka.'
                : 'Jelajahi komunitas atau mulai percakapan.'}
          </p>
          <Button
            href={path === '/saved' && !auth.actor ? '/login' : '/communities'}
            class="cx-button"
            variant="outline"
          >
            {path === '/saved' && !auth.actor ? 'Masuk' : 'Lihat komunitas'}
          </Button>
        </div>{/if}
      {#if nextCursor && path === '/'}<div class="strata-card">
          <Button
            class="cx-button"
            disabled={busy}
            onclick={more}
            type="button"
            variant="outline"
          >
            Muat posting lain
          </Button>
        </div>{/if}
      {#if !loading}<ThreadEnd/>{/if}
    </FeedRefresh>
  {:else}<div class="strata-nodata">
      <h2>Halaman tidak tersedia</h2>
      <Button href="/" class="cx-button" variant="outline">Beranda</Button>
    </div>{/if}
  {#snippet rail()}
    {#if !['explore', 'news', 'communities', 'people', 'wiki'].includes(parts[0])}<NewsSection
        compact
      />
    {:else if parts[0] !== 'news'}<div
        class="cx-context-block rail-context-intro"
      >
        <span class="rail-accent-icon"><BookOpen size={20} /></span>
        <h2>
          {parts[0] === 'news'
            ? 'Dari kabar ke percakapan'
            : parts[0] === 'people'
              ? 'Temukan percakapan'
              : 'Di sekitarmu'}
        </h2>
        <p class="cx-hint">
          {parts[0] === 'news'
            ? 'Baca sumbernya, lalu bagikan sudut pandangmu di komunitas.'
            : 'Komunitas, tempat dan pengetahuan bersama.'}
        </p>
      </div>{/if}
    {#if selectedPost?.contexts?.length}<div class="cx-context-block">
        <h2>Terkait</h2>
        {#each selectedPost.contexts as context}<a
            class="rail-context-link"
            href={'/contexts/' + context.slug}
          >
            {context.title}<ArrowUpRight size={14} />
          </a>{/each}
      </div>{/if}
    {#if community?.description && parts[0] === 'communities'}<div
        class="cx-context-block"
      >
        <h2>Tentang {community.title}</h2>
        <p class="cx-hint">{community.description}</p>
      </div>{/if}
    <div class="cx-context-block">
      <div class="cx-section-head">
        <h2>Komunitas</h2>
        <a href="/communities" aria-label="Semua komunitas">
          <ArrowUpRight size={16} />
        </a>
      </div>
      {#each communities
        .filter((c) => c.id !== community?.id)
        .slice(0, 5) as c}<a
          href={'/communities/' + c.id}
          class="cx-community-mini"
        >
          <span class="cx-avatar sage small avatar-tinted" style={avatarTone(c.id)}>{initials(c.title)}</span>
          <span>
            <strong>{c.title}</strong>
            <small>
              {c.visibility === 'public' ? 'Publik' : 'Khusus anggota'}
            </small>
          </span>
        </a>{/each}{#if !communities.length}<p class="cx-hint">
          Ruang komunitas akan muncul di sini.
        </p>{/if}
    </div>
    <a href="/wiki" class="rail-knowledge-link">
      <BookOpen size={18} />
      <span>Wiki bersama</span>
      <ArrowUpRight size={14} />
    </a>
    <div class="cx-rail-footer">
      <a
        href="https://github.com/yohn-maistre/honai-metro"
        target="_blank"
        rel="noreferrer"
      >
        Honai
      </a>
      <a
        href="https://github.com/yohn-maistre/strata"
        target="_blank"
        rel="noreferrer"
      >
        Strata
      </a>
      <a href="/third-party-notices.txt" target="_blank" rel="noreferrer">
        Lisensi
      </a>
      <span>ETNOS · pratinjau</span>
    </div>
  {/snippet}
</PlatformShell>
<NotificationHost />
{#if authDialogOpen}
  <WelcomeDialog exiting={authDialogLeaving} ready={(authDialogMode !== 'welcome' || !loading) && !authDialogLeaving} mode={authDialogMode} intro={welcomeIntro} bind:handle bind:publishing={publishingConsent} livePublishing={!!cap?.publication.liveAT} {busy} failed={new URLSearchParams(authSearch).has('error')} submitError={authDialogError} onsubmit={login} onclose={closeAuth}/>
{/if}
<Dialog.Root
  open={modal !== null}
  onOpenChange={(value) => {
    if (!value) closeModal()
  }}
>
  <Dialog.Content
    class={'platform-dialog' + (modal === 'compose' ? ' compose-dialog' : '')}
    showCloseButton={modal !== 'compose'}
    springEntrance={modal === 'compose'}
    onEscapeKeydown={(event) => {
      if (modal === 'compose' || modal === 'wiki' || modal === 'proposal') {
        event.preventDefault()
        closeModal()
      }
    }}
    onInteractOutside={(event) => {
      if (modal === 'compose' || modal === 'wiki' || modal === 'proposal') {
        event.preventDefault()
        if (!discardDraft) closeModal()
      }
    }}
  >
    <Dialog.Header>
      {#if modal === 'compose'}<Button
          variant="ghost"
          size="icon"
          class="compose-cancel"
          aria-label="Tutup komposer"
          disabled={composeState.busy}
          onclick={closeModal}
        >
          <X size={19} />
        </Button>
        <Button
          class="compose-submit"
          disabled={!composeState.canSubmit}
          onclick={() => composerApi?.send()}
        >
          Posting
        </Button>{/if}
      <Dialog.Title>
        {modal === 'compose'
          ? 'Posting baru'
          : modal === 'community'
            ? 'Komunitas baru'
            : modal === 'wiki'
              ? 'Halaman Wiki'
              : modal === 'proposal'
                ? 'Usulkan perubahan'
                : modal === 'join'
                  ? 'Minta bergabung'
                  : 'Kelola komunitas'}
      </Dialog.Title><Dialog.Description class="sr-only">
        Isi formulir dan tinjau sebelum mengirim.
      </Dialog.Description>
    </Dialog.Header>
    {#if modal === 'manage'}<div class="strata-stack" style="margin-top:20px">
        <h3 style="font-size:15px">Permintaan bergabung</h3>
        {#each joinRequests.filter((r) => r.state === 'pending') as r}<article
            class="strata-review"
          >
            <p>{r.message}</p>
            <div class="cx-actions">
              <Button
                class="cx-button small"
                disabled={busy}
                onclick={() =>
                  mutate(async () => {
                    await request(`/v1/communities/${communityId}/decide`, {
                      actorId: r.actor_id,
                      approve: true,
                    })
                    await manage(communityId)
                  })}
                type="button"
                variant="outline"
              >
                Terima
              </Button>
              <Button
                class="cx-button small"
                disabled={busy}
                onclick={() =>
                  mutate(async () => {
                    await request(`/v1/communities/${communityId}/decide`, {
                      actorId: r.actor_id,
                      approve: false,
                    })
                    await manage(communityId)
                  })}
                type="button"
                variant="outline"
              >
                Tolak
              </Button>
            </div>
          </article>{/each}{#if !joinRequests.some((r) => r.state === 'pending')}<p
            class="cx-hint"
          >
            Tidak ada permintaan yang menunggu.
          </p>{/if}
        <h3 style="font-size:15px">Laporan</h3>
        {#each reports.filter((r) => r.state === 'open') as r}<article
            class="strata-review"
          >
            <a
              href={'/square/' + r.post_id}
              class="cx-text-link"
              onclick={() => (modal = null)}
            >
              Lihat posting<ArrowUpRight size={13} />
            </a>
            <p>{r.reason}</p>
            <Button
              class="cx-button small"
              disabled={busy}
              onclick={() =>
                mutate(async () => {
                  await request(`/v1/reports/${r.id}/decide`, {
                    state: 'resolved',
                    decision: 'Ditinjau pengelola melalui Strata',
                  })
                  await manage(communityId)
                })}
              type="button"
              variant="outline"
            >
              Tandai ditinjau
            </Button>
          </article>{/each}{#if !reports.some((r) => r.state === 'open')}<p
            class="cx-hint"
          >
            Tidak ada laporan yang menunggu.
          </p>{/if}
      </div>
      <details class="form-details">
        <summary>Posting dan catatan moderator</summary>
        {#each moderation.posts as item}<div class="strata-review">
            <a href={'/square/' + item.id}>
              {item.text.slice(0, 120) || 'Posting'}
            </a>
            <small>
              {item.hidden ? 'Disembunyikan' : ''}
              {item.locked ? 'Dikunci' : ''}
              {item.pinned ? 'Disematkan' : ''}
            </small>
            {#if item.hidden}<Button
                variant="outline"
                size="sm"
                onclick={async () => {
                  try {
                    await request(`/v1/posts/${item.id}/moderate`, {
                      action: 'restore',
                      reason: 'Ditinjau melalui antrean moderator',
                    })
                    await manage(communityId)
                  } catch (e) {
                    modalError =
                      e instanceof Error ? e.message : 'Belum tersimpan.'
                  }
                }}
              >
                Pulihkan
              </Button>{/if}
          </div>{/each}{#each moderation.events.slice(0, 20) as event}<p
            class="cx-hint"
          >
            {event.action} · {event.reason}
          </p>{/each}{#if !moderation.events.length}<p class="cx-hint">
            Belum ada tindakan moderator.
          </p>{/if}
      </details>
    {:else if modal === 'compose' && auth.actor}<PostComposer
        bind:this={composerApi}
        onStateChange={(state) => (composeState = state)}
        actor={auth.actor}
        communities={communities.filter((c) => isMember(c.id))}
        initialCommunity={communityId}
        initialUrl={composeUrl}
        initialKind={composeKind}
        onPosted={(post) => {
          composeState = { dirty: false, busy: false, canSubmit: false }
          modal = null
          navigate('/square/' + post.id)
        }}
      />{:else}<form
        class="cx-form creation-form"
        style="margin-top:18px"
        onsubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {#if modal === 'wiki'}<Label>
            Komunitas
            <Choice
              bind:value={communityId}
              required
              items={communities
                .filter((c) => isSteward(c.id) && c.visibility === 'public')
                .map((c) => ({ value: c.id, label: c.title + ' · Publik' }))}
            />
          </Label>{/if}
        {#if modal === 'community' || modal === 'wiki'}<Label>
            Nama
            <Input bind:value={title} maxlength={160} required />
          </Label>{/if}
        {#if modal === 'community'}<Label>
            Tentang komunitas
            <Textarea
              bind:value={description}
              maxlength={2000}
              rows={3}
              placeholder="Apa yang dibicarakan di sini?"
              required
            ></Textarea>
          </Label>
          <Label>
            Siapa yang dapat membaca?
            <Choice
              bind:value={visibility}
              required
              aria-label="Siapa yang dapat membaca?"
              items={[
                {
                  value: 'public',
                  label: 'Semua orang · publik',
                },
                {
                  value: 'listed-private',
                  label: 'Anggota · nama terlihat publik',
                },
                { value: 'hidden-private', label: 'Anggota · disembunyikan' },
              ]}
            />
          </Label>
          {#if visibility}<div class="audience-notice" role="status">
              <strong>
                {visibility === 'public'
                  ? 'Nama, deskripsi dan percakapan dapat dibaca semua orang.'
                  : visibility === 'listed-private'
                    ? 'Hanya anggota membaca percakapan. Nama dan deskripsi terlihat publik.'
                    : 'Nama, deskripsi dan percakapan hanya terlihat oleh anggota.'}
              </strong>
              <p>
                {visibility === 'public'
                  ? 'Bergabung perlu persetujuan pengelola. Persetujuan ini tidak membatasi pembaca.'
                  : 'Anggota baru hanya masuk melalui undangan.'}
              </p>
            </div>{/if}{/if}
        {#if modal === 'join'}<Label>
            Pesan untuk pengelola<Textarea
              bind:value={text}
              maxlength={500}
              required
              rows={5}
            />
          </Label>{/if}
        {#if modal === 'wiki' || modal === 'proposal'}
          <div class="wiki-draft-notice">
            <p>Draf untuk wiki publik · terbit setelah tinjauan manusia.</p>
            {#if wikiRestored}<strong>
                Draf dipulihkan dari tab ini.
              </strong>{/if}
            {#if wikiDraftStatus}<small role="status">
                {wikiDraftStatus}
              </small>{/if}
            {#if wikiConflict}<p role="alert">
                Halaman sudah berubah sejak draf ini dibuat. Draf tetap
                disimpan. Buka halaman terbaru di tab lain untuk membandingkan
                sebelum melanjutkan.
              </p>
              <a
                href={'/wiki/' + selectedPage?.id}
                target="_blank"
                rel="noopener"
              >
                Buka revisi terbaru
              </a>
              <Button
                type="button"
                variant="outline"
                onclick={() => (wikiBase = selectedPage?.revision_id ?? null)}
              >
                Sudah dibandingkan · gunakan revisi terbaru
              </Button>{/if}
          </div>
          <div class="wiki-editor-field">
            <Label>
              Isi tulisan
            </Label>{#await import('./DocumentEditor.svelte') then module}<module.default
                bind:value={text}
                label="Isi revisi"
                max={50000}
                disabled={busy}
              />{/await}
          </div>
          <details class="wiki-draft-details" open>
            <summary>Sumber, bahasa & atribusi</summary>
            <Label>
              Sumber publik<Textarea
                bind:value={citations}
                placeholder="Satu URL https per baris"
                rows={3}
              />
            </Label><Label>
              Bahasa<Input bind:value={language} maxlength={40} required />
            </Label><Label>
              Atribusi<Input
                bind:value={perspective}
                maxlength={300}
                required
              />
            </Label>
          </details>
          <p class="cx-hint">
            Draf hanya terlihat oleh penulis dan peninjau yang berwenang.
            Halaman terbit setelah tinjauan manusia.
          </p>
        {/if}
        {#if modalError}<p class="cx-form-error" role="alert">
            {modalError}
          </p>{/if}
        <div class="creation-submit">
          <Button
            class="cx-button primary"
            disabled={busy ||
              wikiConflict ||
              (modal === 'community' && !visibility) ||
              ((modal === 'wiki' || modal === 'proposal') &&
                (!text.trim() || text.length > 50000)) ||
              (modal === 'wiki' && !communityId)}
            type="submit"
            variant="default"
          >
            {#if busy}<LoaderCircle size={15} />{/if}{modal === 'join'
              ? 'Kirim permintaan'
              : modal === 'proposal' || modal === 'wiki'
                ? 'Ajukan untuk tinjauan'
                : 'Buat'}<Send size={14} />
          </Button>
        </div>
      </form>{/if}
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={discardDraft}>
  <AlertDialog.Content class="draft-confirm">
    <AlertDialog.Header>
      <AlertDialog.Title>Buang draf?</AlertDialog.Title><AlertDialog.Description
      >
        {modal === 'wiki' || modal === 'proposal'
          ? 'Tulisan, sumber dan atribusi dalam draf ini akan dihapus dari tab ini.'
          : 'Tulisan dan lampiran yang belum dikirim akan dilepas.'}
      </AlertDialog.Description>
    </AlertDialog.Header><AlertDialog.Footer>
      <AlertDialog.Cancel>Lanjut menulis</AlertDialog.Cancel><AlertDialog.Action
        onclick={() => {
          if (modal === 'wiki' || modal === 'proposal') forgetWikiDraft()
          composeState = { dirty: false, busy: false, canSubmit: false }
          modal = null
          discardDraft = false
        }}
      >
        Buang draf
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<SearchDialog
  bind:open={searchDialogOpen}
  bind:query={searchQuery}
  {navigate}
/>
