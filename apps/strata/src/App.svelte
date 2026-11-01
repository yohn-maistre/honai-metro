<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import {
    Users,
    Bookmark,
    BookOpen,
    X,
    Plus,
    ArrowUpRight,
    ArrowLeft,
    Send,
    Globe,
    LockKeyhole,
    ShieldCheck,
    RefreshCw,
    LoaderCircle,
    MessageCircle,
    MessageSquare,
    ChevronRight,
    LogOut,
    FileText,
    GitPullRequest,
    History,
  } from '@lucide/svelte'
  import DiscoveryPage from './DiscoveryPage.svelte'
  import PixelLoader from './PixelLoader.svelte'
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
  import LoginForm from '$lib/components/login-form.svelte'
  import FeaturePages from './FeaturePages.svelte'
  import { applyAppearance, restoreAppearance } from './appearance.svelte'
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
    relativeDate,
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
    profile = $state<Actor | null>(null)
  let path = $state(location.pathname),
    search = $state(location.search),
    loading = $state(true),
    busy = $state(false),
    message = $state(''),
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
  let modal = $state<
    null | 'compose' | 'community' | 'wiki' | 'proposal' | 'manage' | 'join'
  >(null)
  let composeState = $state({ dirty: false, busy: false }),
    discardDraft = $state(false)
  function closeModal() {
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
    visibility = $state<Community['visibility']>('public'),
    communityId = $state(''),
    citations = $state(''),
    language = $state('id'),
    perspective = $state(''),
    modalError = $state('')
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
  let generation = 0,
    notificationTimer: ReturnType<typeof setTimeout> | undefined
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
    path === '/'
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
                              ? 'Organisasi & kelompok'
                              : parts[0] === 'work'
                                ? 'Kerja publik'
                                : parts[0] === 'contexts'
                                  ? 'Konteks'
                                  : 'ETNOS',
  )
  function notify(value: string) {
    message = value
    clearTimeout(notificationTimer)
    notificationTimer = setTimeout(() => (message = ''), 6500)
  }
  function fail(value: unknown) {
    notify(
      value instanceof Error
        ? value.message
        : 'Permintaan belum dapat diselesaikan.',
    )
  }
  function navigate(href: string) {
    const u = new URL(href, location.origin)
    historyPush(u)
    void load()
    document.getElementById('commons-main')?.focus()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function historyPush(u: URL) {
    window.history.pushState({}, '', u)
    path = u.pathname
    search = u.search
    tab = 'discussion'
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
      setCsrf(identity.csrf)
      profile = null
      const filters = new SvelteURLSearchParams({ roots: 'true', limit: '30' })
      if (parts[0] === 'communities' && parts[1])
        filters.set('community', parts[1])
      if (path === '/' && feedTab === 'following' && identity.actor)
        filters.set('following', 'true')
      if (parts[0] === 'people' && parts[1]) filters.set('author', parts[1])
      if (parts[0] === 'find')
        filters.set('q', new SvelteURLSearchParams(search).get('q') ?? '')
      const [cs, feed, pages, roles, features, followed] = await Promise.all([
        request<Community[]>('/v1/communities'),
        request<{ items: Post[]; pinned?: Post[]; nextCursor: string | null }>(
          '/v1/feed/page?' + filters,
        ),
        request<WikiPage[]>('/v1/wiki'),
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
        const root =
          p.rootId === p.id ? p : await request<Post>('/v1/posts/' + p.rootId)
        const thread = await request<{
          items: Post[]
          nextCursor: string | null
        }>('/v1/posts/' + root.id + '/replies')
        if (mine !== generation) return
        selectedPost = root
        replies = thread.items
        repliesCursor = thread.nextCursor
        if (p.id !== root.id && !replies.some((r) => r.id === p.id))
          replies = [...replies, p]
        if (p.id !== root.id) {
          await tick()
          document
            .getElementById('post-' + p.id)
            ?.scrollIntoView({ block: 'center' })
        }
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
      if (mine === generation) loading = false
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
    composeState = { dirty: false, busy: false }
    modal = kind
    communityId = id || memberships[0]?.community_id || communities[0]?.id || ''
    text = ''
    title = ''
    description = ''
    citations = ''
    perspective = ''
    modalError = ''
    visibility = 'public'
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
          { title },
        )
        modal = null
        navigate('/wiki/' + p.id)
      } else if (modal === 'proposal' && selectedPage) {
        await request(`/v1/wiki/${selectedPage.id}/proposals`, {
          baseRevision: selectedPage.revision_id,
          text,
          citations: citations
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
          language,
          perspective,
        })
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
  async function login() {
    await mutate(async () => {
      const result = await request<{ authorizationUrl: string }>(
        '/auth/start',
        { handle: handle.trim(), publishing: publishingConsent },
      )
      location.assign(result.authorizationUrl)
    })
  }
  async function logout() {
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
      if (parts[0] === 'people' && parts[1]) q.set('author', parts[1])
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
    restoreAppearance()
    void load()
    return () => clearTimeout(notificationTimer)
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
    path = location.pathname
    search = location.search
    void load()
  }}
/>
<PlatformShell
  {path}
  {heading}
  {auth}
  {unread}
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
  {#if loading && !['messages', 'notifications', 'groups', 'work', 'contexts', 'explore'].includes(parts[0])}<div
      class="route-progress"
    >
      <PixelLoader />
    </div>{/if}
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
  {:else if path === '/labs/spaces'}<SpacesLab />
  {:else if path === '/login'}
    <h1 class="sr-only">Masuk</h1>
    <section class="strata-narrow">
      <LoginForm
        bind:handle
        bind:publishing={publishingConsent}
        livePublishing={!!cap?.publication.liveAT}
        {busy}
        failed={new SvelteURLSearchParams(search).has('error')}
        onsubmit={login}
      />
    </section>
  {:else if path === '/preferences'}
    <div class="cx-page-head"><h1>Pengaturan</h1></div>
    <Card.Root class="strata-card strata-preferences">
      <AppearancePanel />
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
      onError={notify}
      onUnread={(n) => (unread = n)}
    />
  {:else if ['groups', 'work', 'contexts', 'explore'].includes(parts[0])}
    <FeaturePages {path} {auth} onError={notify} {navigate} />
  {:else if parts[0] === 'wiki'}
    <div class="cx-page-head">
      <h1>{selectedPage?.title ?? 'Wiki'}</h1>
      {#if !selectedPage && memberships.some((m) => m.role !== 'member')}<Button
          class="cx-button small"
          onclick={() => open('wiki')}
          type="button"
          variant="outline"
        >
          <Plus size={14} />Halaman
        </Button>{/if}
    </div>
    {#if selectedPage}<Card.Root class="strata-card">
        <a href="/wiki" class="cx-back"><ArrowLeft size={14} />Wiki</a>
        {#if selectedPage.revision}<p class="strata-caption">
            <FileText size={14} />{selectedPage.revision.language} · {selectedPage
              .revision.perspective}
          </p>
          <div class="cx-document strata-body" style="margin:20px 0">
            {selectedPage.revision.text}
          </div>
          {#each selectedPage.revision.citations as url}<a
              class="strata-source"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {url}<ArrowUpRight size={12} />
            </a>{/each}{:else}<p class="cx-muted">
            Belum ada revisi yang diterima.
          </p>{/if}{#if isMember(selectedPage.community_id)}<Button
            class="cx-button small"
            style="margin-top:18px"
            onclick={() => {
              open('proposal')
              text = selectedPage?.revision?.text ?? ''
              language = selectedPage?.revision?.language ?? 'id'
              perspective = selectedPage?.revision?.perspective ?? ''
              citations = selectedPage?.revision?.citations.join('\n') ?? ''
            }}
            type="button"
            variant="outline"
          >
            <GitPullRequest size={14} />Usulkan perubahan
          </Button>{/if}
      </Card.Root>
      {#if proposals.length}<Card.Root class="strata-card">
          <h2 style="font-size:16px">Usulan</h2>
          {#each proposals as p}<article class="strata-review">
              <Badge variant="secondary">
                {p.state === 'pending'
                  ? 'Menunggu tinjauan'
                  : p.state === 'accepted'
                    ? 'Diterima'
                    : 'Ditolak'}
              </Badge>
              <p class="strata-caption" style="margin-top:12px">
                {p.language} · {p.perspective}
              </p>
              <p class="strata-body">{p.text}</p>
              {#each p.citations as url}<a
                  class="strata-source"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {url}
                </a>{/each}{#if p.state === 'pending' && isSteward(selectedPage.community_id)}<div
                  class="cx-actions"
                  style="margin-top:16px"
                >
                  <Button
                    class="cx-button primary small"
                    disabled={busy}
                    onclick={() => decide(p, true)}
                    type="button"
                    variant="default"
                  >
                    Terima revisi
                  </Button>
                  <Button
                    class="cx-button small"
                    disabled={busy}
                    onclick={() => decide(p, false)}
                    type="button"
                    variant="outline"
                  >
                    Tolak
                  </Button>
                </div>{/if}
            </article>{/each}
        </Card.Root>{/if}
      {#if history.length}<Card.Root class="strata-card">
          <h2 class="strata-inline" style="font-size:16px">
            <History size={16} />Riwayat
          </h2>
          {#each history as rev}<div class="cx-list-row">
              <FileText size={16} />
              <div>
                <strong>{rev.perspective}</strong>
                <small>
                  {rev.language} · {relativeDate(rev.created)}
                </small>
              </div>
            </div>{/each}
        </Card.Root>{/if}
    {:else if wiki.length}<section>
        {#each wiki as p}<a
            href={'/wiki/' + p.id}
            class="cx-list-row strata-card"
          >
            <span class="cx-object-icon"><BookOpen size={20} /></span>
            <div>
              <h3>{p.title}</h3>
              <small>
                {communities.find((c) => c.id === p.community_id)?.title} ·
                {p.revision_id ? 'Ada revisi diterima' : 'Belum ada revisi'}
              </small>
            </div>
            <ChevronRight size={16} />
          </a>{/each}
      </section>{:else if !loading}<div class="strata-nodata">
        <div class="strata-empty-graphic"><BookOpen size={27} /></div>
        <h2>Belum ada halaman</h2>
        <p>Halaman, sumber dan revisi yang diterima akan muncul di sini.</p>
        <Button class="cx-button" href="/communities" variant="outline">
          Lihat komunitas
        </Button>
      </div>{/if}
  {:else if parts[0] === 'communities' && parts[1]}
    {#if community}<div class="cx-detail-head">
        <div class="cx-between">
          <span class="cx-avatar sage">{initials(community.title)}</span>
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
        <Tabs.List variant="line" class="page-tabs" aria-label="Isi komunitas">
          <Tabs.Trigger value="discussion">Diskusi</Tabs.Trigger><Tabs.Trigger
            value="wiki"
          >
            Wiki
          </Tabs.Trigger><Tabs.Trigger value="about">Tentang</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value={tab}>
          {#if tab === 'about'}<Card.Root class="strata-card">
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
            </Card.Root>{:else}{#each posts as p}<PostCard
                post={p}
                {community}
                loggedIn={!!auth.actor}
                canVote={!!currentMembership}
                onError={notify}
              />{/each}{#if !posts.length && !loading}<div
                class="strata-nodata"
              >
                <MessageCircle size={26} />
                <h2>Belum ada percakapan</h2>
                <p>
                  {currentMembership
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
    <div class="cx-page-head">
      <h1>Komunitas</h1>
      {#if auth.actor}<Button
          class="cx-button small"
          onclick={() => open('community')}
          type="button"
          variant="outline"
        >
          <Plus size={14} />Komunitas
        </Button>{/if}
    </div>
    <div class="strata-mosaic">
      {#each communities as c}<a
          href={'/communities/' + c.id}
          class="strata-tile"
        >
          <div class="cx-between">
            <span class="cx-avatar sage small">{initials(c.title)}</span>
            <ArrowUpRight size={18} />
          </div>
          <div>
            <h2>{c.title}</h2>
            <p>{c.description}</p>
            <span class="strata-small">
              {c.visibility === 'public'
                ? 'Publik'
                : 'Khusus anggota'}{isMember(c.id) ? ' · Bergabung' : ''}
            </span>
          </div>
        </a>{/each}
    </div>
    {#if !communities.length && !loading}<div class="strata-nodata">
        <div class="strata-empty-graphic"><Users size={27} /></div>
        <h2>Ruang untuk komunitasmu</h2>
        <p>Komunitas akan muncul di sini.</p>
        {#if !auth.actor}<Button
            href="/login"
            class="cx-button primary"
            variant="default"
          >
            Masuk
          </Button>{/if}
      </div>{/if}
  {:else if parts[0] === 'square'}
    {#if selectedPost}<ThreadView
        post={selectedPost}
        {replies}
        cursor={repliesCursor}
        community={communities.find((c) => c.id === selectedPost!.community_id)}
        actor={auth.actor}
        member={isMember(selectedPost.community_id)}
        onError={notify}
        onRefresh={load}
      />{:else if !loading}<div class="strata-nodata">
        <h2>Posting tidak tersedia</h2>
      </div>{/if}
  {:else if parts[0] === 'people'}
    {@const actor = profile}{#if actor}<div class="cx-detail-head profile-head">
        <span class="cx-avatar sage">{initials(actor.name)}</span>
        <h1>{actor.name}</h1>
        <details class="profile-identity">
          <summary>Identitas AT</summary>
          <p class="cx-hint">{actor.did}</p>
        </details>
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
            {following.some((a) => a.id === actor.id) ? 'Mengikuti' : 'Ikuti'}
          </Button>{/if}
        {#if auth.actor && auth.actor.id !== actor.id && actor.kind === 'human'}<Button
            href={'/messages?to=' + actor.id}
            variant="outline"
          >
            <MessageSquare size={16} />Pesan
          </Button>{/if}
        {#if actor.kind === 'agent'}<Badge variant="secondary">AI</Badge>{/if}
      </div>
      {#each posts.filter((p) => p.author.id === actor.id) as p}<PostCard
          post={p}
          community={communities.find((c) => c.id === p.community_id)}
          loggedIn={!!auth.actor}
          canVote={isMember(p.community_id)}
          onError={notify}
        />{/each}
      {#if nextCursor}<div class="profile-more">
          <Button variant="outline" disabled={busy} onclick={more}>
            Muat posting lain
          </Button>
        </div>{/if}
      {#if !posts.length && !loading}<p class="search-state">
          Belum ada posting yang dapat kamu lihat.
        </p>{/if}
    {:else if !loading}<div class="strata-nodata">
        <h2>Profil tidak tersedia</h2>
        <p>
          Identitas anggota privat tidak ditampilkan dalam direktori publik.
        </p>
      </div>{/if}
  {:else if path === '/' || path === '/saved' || path === '/find'}
    <FeedRefresh
      enabled={path === '/' && modal === null && !searchDialogOpen}
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
          <span class="cx-avatar sage">
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
          onError={notify}
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
    </FeedRefresh>
  {:else}<div class="strata-nodata">
      <h2>Halaman tidak tersedia</h2>
      <Button href="/" class="cx-button" variant="outline">Beranda</Button>
    </div>{/if}
  {#snippet rail()}
    <NewsSection compact />
    <div class="cx-context-block">
      <div class="cx-section-head">
        <h2>Komunitas</h2>
        <a href="/communities" aria-label="Semua komunitas">
          <ArrowUpRight size={16} />
        </a>
      </div>
      {#each communities.slice(0, 4) as c}<a
          href={'/communities/' + c.id}
          class="cx-community-mini"
        >
          <span class="cx-avatar sage small">{initials(c.title)}</span>
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
{#if message}<div class="cx-toast" role="status">
    <span>{message}</span>
    <Button
      class="cx-icon-button"
      aria-label="Tutup notifikasi"
      onclick={() => (message = '')}
      type="button"
      variant="outline"
    >
      <X size={16} />
    </Button>
  </div>{/if}
<Dialog.Root
  open={modal !== null}
  onOpenChange={(value) => {
    if (!value) closeModal()
  }}
>
  <Dialog.Content
    class={'platform-dialog' + (modal === 'compose' ? ' compose-dialog' : '')}
    showCloseButton={modal !== 'compose'}
    onEscapeKeydown={(event) => {
      if (modal === 'compose') {
        event.preventDefault()
        closeModal()
      }
    }}
    onInteractOutside={(event) => {
      if (modal === 'compose') {
        event.preventDefault()
        if (!discardDraft) closeModal()
      }
    }}
  >
    <Dialog.Header>
      {#if modal === 'compose'}<Button
          class="compose-cancel"
          variant="ghost"
          disabled={composeState.busy}
          onclick={closeModal}
        >
          Batal
        </Button><Button
          class="compose-close"
          variant="ghost"
          size="icon"
          aria-label="Tutup"
          disabled={composeState.busy}
          onclick={closeModal}
        >
          <X size={18} />
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
        onStateChange={(state) => (composeState = state)}
        actor={auth.actor}
        communities={communities.filter((c) => isMember(c.id))}
        initialCommunity={communityId}
        onPosted={(post) => {
          composeState = { dirty: false, busy: false }
          modal = null
          navigate('/square/' + post.id)
        }}
      />{:else}<form
        class="cx-form"
        style="margin-top:22px"
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
            <Textarea bind:value={description} maxlength={2000} required
            ></Textarea>
          </Label>
          <Label>
            Siapa yang dapat membaca?
            <Choice
              bind:value={visibility}
              items={[
                {
                  value: 'public',
                  label: 'Publik · bergabung dengan persetujuan',
                },
                {
                  value: 'listed-private',
                  label: 'Anggota · nama terlihat publik',
                },
                { value: 'hidden-private', label: 'Anggota · disembunyikan' },
              ]}
            />
          </Label>{/if}
        {#if modal === 'join' || modal === 'proposal'}<Label>
            {modal === 'join'
              ? 'Pesan untuk pengelola'
              : modal === 'proposal'
                ? 'Isi revisi'
                : 'Posting'}
            <Textarea
              bind:value={text}
              maxlength={modal === 'proposal'
                ? 50000
                : modal === 'join'
                  ? 500
                  : 6000}
              required
              rows={modal === 'proposal' ? 10 : 5}
              placeholder=""
            ></Textarea>
          </Label>{/if}
        {#if modal === 'proposal'}<Label>
            Sumber publik
            <Textarea
              bind:value={citations}
              placeholder="Satu URL https per baris"
              rows={3}
            ></Textarea>
          </Label>
          <Label>
            Bahasa
            <Input bind:value={language} maxlength={40} required />
          </Label>
          <Label>
            Perspektif / atribusi
            <Input bind:value={perspective} maxlength={300} required />
          </Label>
          <p class="cx-hint">
            Usulan hanya terlihat oleh penulis dan pengelola. Revisi diterbitkan
            setelah tinjauan manusia.
          </p>{/if}
        {#if modalError}<p class="cx-form-error" role="alert">
            {modalError}
          </p>{/if}
        <Button
          class="cx-button primary"
          disabled={busy || (modal === 'wiki' && !communityId)}
          type="submit"
          variant="default"
        >
          {#if busy}<LoaderCircle size={15} />{/if}{modal === 'join'
            ? 'Kirim permintaan'
            : modal === 'proposal'
              ? 'Ajukan untuk tinjauan'
              : 'Buat'}<Send size={14} />
        </Button>
      </form>{/if}
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={discardDraft}>
  <AlertDialog.Content class="draft-confirm">
    <AlertDialog.Header>
      <AlertDialog.Title>Buang draf?</AlertDialog.Title><AlertDialog.Description
      >
        Tulisan dan lampiran yang belum dikirim akan dilepas.
      </AlertDialog.Description>
    </AlertDialog.Header><AlertDialog.Footer>
      <AlertDialog.Cancel>Lanjut menulis</AlertDialog.Cancel><AlertDialog.Action
        onclick={() => {
          composeState = { dirty: false, busy: false }
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
