<script lang="ts">
  import { untrack } from 'svelte'
  import {
    Building2,
    Users,
    Globe,
    LockKeyhole,
    Plus,
    ArrowLeft,
    ArrowUpRight,
    MapPin,
    ListTodo,
    BookOpen,
    Check,
    LoaderCircle,
    Link,
  } from '@lucide/svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import Choice from './Choice.svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import PostCard from './PostCard.svelte'
  import {
    request,
    initials,
    relativeDate,
    type Auth,
    type Community,
    type Membership,
    type Post,
  } from './api'
  type Context = {
    id: string
    slug: string
    title: string
    kind: string
    description: string
  }
  type Group = {
    id: string
    title: string
    description: string
    kind: 'collective' | 'institution'
    visibility: 'public' | 'hidden-private'
    sponsorship: string
    spaces: Community[]
    contexts: Context[]
  }
  type Work = {
    id: string
    group_id: string
    community_id: string
    title: string
    description: string
    state: string
    revision: number
    updated: number
    origin_post_id: string | null
    sponsor: { id: string; title: string; sponsorship: string }
    contexts: Context[]
    result: { id: string; text: string; citations: string[] } | null
  }
  type ContextDetail = Context & {
    groups: Group[]
    pages: { id: string; title: string }[]
  }
  type Result = {
    id: string
    digest: string
    text: string
    citations: string[]
    state: string
    author_id: string
  }
  let {
    path,
    auth,
    onError,
    navigate,
  }: {
    path: string
    auth: Auth
    onError: (s: string) => void
    navigate: (s: string) => void
  } = $props()
  let communities = $state<Community[]>([]),
    memberships = $state<Membership[]>([])
  let groups = $state<Group[]>([]),
    contexts = $state<Context[]>([]),
    works = $state<Work[]>([]),
    roles = $state<{ group_id: string; role: string }[]>([])
  let group = $state<Group | null>(null),
    work = $state<Work | null>(null),
    context = $state<
      | (Context & { groups: Group[]; pages: { id: string; title: string }[] })
      | null
    >(null),
    posts = $state<Post[]>([]),
    results = $state<Result[]>([])
  let loading = $state(true),
    busy = $state(false),
    error = $state(''),
    modal = $state<
      null | 'group' | 'space' | 'work' | 'context' | 'result' | 'members'
    >(null),
    modalError = $state(''),
    tab = $state('spaces')
  let title = $state(''),
    description = $state(''),
    kind = $state('institution'),
    visibility = $state('public'),
    communityId = $state(''),
    groupId = $state(''),
    contextId = $state(''),
    slug = $state(''),
    language = $state('id'),
    citations = $state(''),
    memberId = $state(''),
    memberQuery = $state(''),
    memberOptions = $state<{ id: string; name: string; kind: string }[]>([]),
    memberRole = $state('member'),
    bindId = $state(''),
    requestKey = $state('')
  let roster = $state<
    { actor_id: string; name: string; role: string; active: number }[]
  >([])
  let generation = 0
  const segments = $derived(path.split('/').filter(Boolean)),
    canManage = (id: string) =>
      roles.some(
        (r) => r.group_id === id && ['owner', 'steward'].includes(r.role),
      ),
    isMember = (id: string) => memberships.some((r) => r.community_id === id)
  const eligible = $derived(
    groups.filter(
      (g) =>
        canManage(g.id) &&
        g.visibility === 'public' &&
        g.sponsorship === 'enabled',
    ),
  )
  const states: Record<string, string> = {
    proposed: 'Direncanakan',
    adopted: 'Diadopsi',
    active: 'Berjalan',
    blocked: 'Terhambat',
    completed: 'Selesai',
    withdrawn: 'Ditarik',
  }
  const kinds: Record<string, string> = {
    place: 'Tempat',
    region: 'Wilayah',
    topic: 'Topik',
    language: 'Bahasa',
  }
  async function load(route = path, actorId = auth.actor?.id) {
    const mine = ++generation
    loading = true
    error = ''
    group = null
    work = null
    context = null
    results = []
    posts = []
    try {
      const [gs, cs, ws, rs, forums, forumRoles] = await Promise.all([
        request<Group[]>('/v1/groups'),
        request<Context[]>('/v1/contexts'),
        request<Work[]>('/v1/work'),
        actorId
          ? request<typeof roles>('/v1/group-memberships')
          : Promise.resolve([]),
        request<Community[]>('/v1/communities'),
        actorId
          ? request<Membership[]>('/v1/memberships')
          : Promise.resolve([]),
      ])
      if (mine !== generation) return
      communities = forums
      memberships = forumRoles
      groups = gs
      contexts = cs
      works = ws
      roles = rs
      const [page, id] = route.split('/').filter(Boolean)
      if (page === 'groups' && id) {
        const g = await request<Group>('/v1/groups/' + id)
        if (mine !== generation) return
        group = g
      }
      if (page === 'work' && id) {
        const w = await request<Work>('/v1/work/' + id)
        if (mine !== generation) return
        work = w
        if (canManage(w.group_id)) {
          const ps = await request<Result[]>('/v1/work/' + id + '/proposals')
          if (mine === generation) results = ps
        }
      }
      if (page === 'contexts' && id) {
        const c = await request<ContextDetail>('/v1/contexts/' + id)
        const feed = await request<{ items: Post[] }>(
          '/v1/feed/page?roots=true&context=' + encodeURIComponent(c.id),
        )
        if (mine !== generation) return
        context = c
        posts = feed.items
        works = ws.filter((w) => w.contexts.some((x) => x.id === c.id))
      }
    } catch (e) {
      if (mine === generation)
        error = e instanceof Error ? e.message : 'Halaman belum dapat dimuat.'
    } finally {
      if (mine === generation) loading = false
    }
  }
  $effect(() => {
    const route = path,
      actorId = auth.actor?.id
    untrack(() => void load(route, actorId))
    return () => {
      generation++
    }
  })
  function open(value: typeof modal) {
    if (!auth.actor) {
      navigate('/login')
      return
    }
    modal = value
    modalError = ''
    title = ''
    description = ''
    citations = ''
    visibility = 'public'
    kind = 'institution'
    contextId = ''
    bindId = ''
    memberId = ''
    memberQuery = ''
    memberOptions = []
    groupId = group?.id ?? eligible[0]?.id ?? ''
    communityId =
      communities.find((c) => c.visibility === 'public' && isMember(c.id))
        ?.id ?? ''
    requestKey = crypto.randomUUID()
    if (value === 'members' && group)
      void request<typeof roster>('/v1/groups/' + group.id + '/members')
        .then((r) => (roster = r))
        .catch((e) => (modalError = e.message))
  }
  async function action(fn: () => Promise<void>) {
    if (busy) return
    busy = true
    try {
      await fn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Permintaan gagal.'
      if (modal) modalError = msg
      else onError(msg)
    } finally {
      busy = false
    }
  }
  async function submit() {
    await action(async () => {
      if (modal === 'group') {
        const g = await request<Group>('/v1/groups', {
          title,
          description,
          kind,
          visibility,
        })
        modal = null
        navigate('/groups/' + g.id)
      } else if (modal === 'space' && group) {
        await request(
          '/v1/groups/' + group.id + '/spaces',
          bindId
            ? { communityId: bindId }
            : { title, description, visibility, automation: false },
        )
        modal = null
        await load()
      } else if (modal === 'context') {
        const c = await request<Context>('/v1/contexts', {
          title,
          description,
          slug:
            slug ||
            title
              .normalize('NFKD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 64) ||
            'konteks-' + crypto.randomUUID().slice(0, 8),
          kind,
          language,
          aliases: [],
        })
        modal = null
        navigate('/contexts/' + c.slug)
      } else if (modal === 'work') {
        const w = await request<Work>('/v1/work', {
          groupId,
          communityId,
          title,
          description,
          requestKey,
          contextIds: contextId ? [contextId] : [],
        })
        modal = null
        navigate('/work/' + w.id)
      } else if (modal === 'result' && work) {
        await request('/v1/work/' + work.id + '/proposals', {
          text: description,
          citations: citations
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        })
        modal = null
        await load()
      } else if (modal === 'members' && group) {
        await request('/v1/groups/' + group.id + '/members', {
          actorId: memberId,
          role: memberRole,
          active: true,
        })
        roster = await request('/v1/groups/' + group.id + '/members')
        memberId = ''
      }
    })
  }
</script>

{#snippet workList(items: Work[])}
  <div class="work-list">
    {#each items as w}<Card.Root class="object-card">
        <Card.Content>
          <div class="cx-between">
            <Badge variant="secondary">{states[w.state] ?? w.state}</Badge>
            <span class="cx-hint">{relativeDate(w.updated)}</span>
          </div>
          <a class="object-title" href={'/work/' + w.id}>{w.title}</a>
          <p class="line-clamp-2 cx-hint">{w.description}</p>
          <a class="object-sponsor" href={'/groups/' + w.sponsor.id}>
            <Building2 size={14} />{w.sponsor.title}
          </a>
        </Card.Content>
      </Card.Root>{/each}
  </div>
{/snippet}
{#if loading}<ContentSkeleton />
{:else if error}<div class="strata-card">
    <h1>Halaman belum tersedia</h1>
    <p role="alert" class="cx-hint">{error}</p>
    <Button variant="outline" onclick={() => load()}>Coba lagi</Button>
  </div>
{:else if segments[0] === 'groups' && group}
  <div class="cx-detail-head">
    <a class="cx-back" href="/groups">
      <ArrowLeft size={15} />Organisasi & kelompok
    </a>
    <div class="cx-between">
      <Avatar.Root class="size-14">
        <Avatar.Fallback>{initials(group.title)}</Avatar.Fallback>
      </Avatar.Root><Badge variant="outline">
        {group.visibility === 'public' ? 'Publik' : 'Privat'}
      </Badge>
    </div>
    <h1>{group.title}</h1>
    <p>{group.description}</p>
    <div class="context-links">
      {#each group.contexts as c}<Badge
          href={'/contexts/' + c.slug}
          variant="secondary"
        >
          <MapPin size={12} />{c.title}
        </Badge>{/each}
    </div>
    {#if canManage(group.id)}<div class="cx-actions">
        <Button variant="outline" onclick={() => open('space')}>
          <Plus size={16} />Ruang
        </Button><Button variant="outline" onclick={() => open('members')}>
          Kelola anggota
        </Button>{#if group.sponsorship === 'enabled'}<Button
            onclick={() => open('work')}
          >
            <Plus size={16} />Kerja publik
          </Button>{:else if group.visibility === 'public'}<Button
            variant="outline"
            disabled={busy || group.sponsorship === 'pending'}
            onclick={() =>
              action(async () => {
                await request(
                  '/v1/groups/' + group!.id + '/request-sponsorship',
                  {},
                )
                await load()
              })}
          >
            {group.sponsorship === 'pending'
              ? 'Sponsor menunggu tinjauan'
              : 'Ajukan sebagai sponsor'}
          </Button>{/if}
      </div>{/if}
    {#if auth.steward && group.sponsorship === 'pending'}<div
        class="review-banner"
      >
        <p>Permintaan sponsor kerja publik</p>
        <Button
          disabled={busy}
          onclick={() =>
            action(async () => {
              await request('/v1/groups/' + group!.id + '/sponsorship', {
                enabled: true,
              })
              await load()
            })}
        >
          <Check size={15} />Setujui sponsor
        </Button>
      </div>{/if}
    {#if auth.steward && group.sponsorship === 'enabled'}<Button
        variant="ghost"
        disabled={busy}
        onclick={() =>
          action(async () => {
            await request('/v1/groups/' + group!.id + '/sponsorship', {
              enabled: false,
            })
            await load()
          })}
      >
        Tangguhkan sponsor
      </Button>{/if}
  </div>
  <Tabs.Root bind:value={tab}>
    <Tabs.List variant="line" class="page-tabs" aria-label="Profil kelompok">
      <Tabs.Trigger value="spaces">Ruang</Tabs.Trigger><Tabs.Trigger
        value="work"
      >
        Kerja publik
      </Tabs.Trigger><Tabs.Trigger value="about">Tentang</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="spaces">
      <div class="object-grid">
        {#each group.spaces as space}<Card.Root class="object-card">
            <Card.Content>
              <div class="cx-between">
                <Users
                  size={20}
                />{#if space.visibility !== 'public'}<LockKeyhole
                    size={15}
                  />{:else}<Globe size={15} />{/if}
              </div>
              <a class="object-title" href={'/communities/' + space.id}>
                {space.title}
              </a>
              <p class="cx-hint line-clamp-2">{space.description}</p>
              <Badge variant="outline">
                {space.visibility === 'public' ? 'Publik' : 'Khusus anggota'}
              </Badge>
            </Card.Content>
          </Card.Root>{/each}
      </div>
      {#if !group.spaces.length}<div class="strata-nodata">
          <Users size={26} />
          <h2>Belum ada ruang yang tersedia</h2>
        </div>{/if}
    </Tabs.Content>
    <Tabs.Content value="work">
      {@render workList(
        works.filter((w) => w.group_id === group!.id),
      )}{#if !works.some((w) => w.group_id === group!.id)}<div
          class="strata-nodata"
        >
          <ListTodo size={26} />
          <h2>Belum ada kerja publik</h2>
        </div>{/if}
    </Tabs.Content>
    <Tabs.Content value="about">
      <Card.Root class="strata-card">
        <h2>
          Profil {group.kind === 'institution' ? 'institusi' : 'kelompok'}
        </h2>
        <p class="strata-body">{group.description}</p>
        <p class="cx-hint">
          Keanggotaan kelompok dan akses tiap ruang diatur terpisah.
        </p>
        {#if canManage(group.id) && group.visibility === 'public' && contexts.length}<form
            class="cx-form"
            onsubmit={(e) => {
              e.preventDefault()
              action(async () => {
                await request('/v1/groups/' + group!.id + '/contexts', {
                  contextId,
                })
                await load()
              })
            }}
          >
            <Label for="group-context">Tambahkan konteks publik</Label><Choice
              id="group-context"
              bind:value={contextId}
              required
              items={[
                { value: '', label: 'Pilih konteks' },
                ...contexts.map((c) => ({ value: c.id, label: c.title })),
              ]}
            /><Button type="submit" variant="outline" disabled={busy}>
              Tambahkan
            </Button>
          </form>
          {#each group.contexts as c}<Button
              variant="ghost"
              disabled={busy}
              onclick={() =>
                action(async () => {
                  await request('/v1/groups/' + group!.id + '/contexts', {
                    contextId: c.id,
                    remove: true,
                  })
                  await load()
                })}
            >
              Lepaskan {c.title}
            </Button>{/each}{/if}
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
{:else if segments[0] === 'work' && work}
  <div class="cx-detail-head">
    <a href="/work" class="cx-back"><ArrowLeft size={15} />Kerja publik</a>
    <div class="cx-between">
      <Badge variant="secondary">{states[work.state]}</Badge>
      <span class="cx-hint">Revisi {work.revision}</span>
    </div>
    <h1>{work.title}</h1>
    <a class="object-sponsor" href={'/groups/' + work.sponsor.id}>
      <Building2 size={16} />{work.sponsor.title}
    </a>
    <p class="strata-body">{work.description}</p>
    <div class="context-links">
      {#each work.contexts as c}<Badge
          href={'/contexts/' + c.slug}
          variant="secondary"
        >
          {c.title}
        </Badge>{/each}
    </div>
    {#if work.origin_post_id}<Button
        href={'/square/' + work.origin_post_id}
        variant="outline"
      >
        <Link size={15} />Percakapan asal
      </Button>{/if}
    {#if canManage(work.group_id) && work.sponsor.sponsorship === 'enabled' && isMember(work.community_id) && !['completed', 'withdrawn'].includes(work.state)}<div
        class="cx-actions"
      >
        <Button onclick={() => open('result')}>Usulkan hasil</Button><Button
          variant="outline"
          disabled={busy}
          onclick={() =>
            action(async () => {
              await request('/v1/work/' + work!.id + '/state', {
                revision: work!.revision,
                state: work!.state === 'active' ? 'blocked' : 'active',
              })
              await load()
            })}
        >
          {work.state === 'active' ? 'Tandai terhambat' : 'Mulai kerja'}
        </Button><Button
          variant="ghost"
          disabled={busy}
          onclick={() =>
            action(async () => {
              await request('/v1/work/' + work!.id + '/state', {
                revision: work!.revision,
                state: 'withdrawn',
              })
              await load()
            })}
        >
          Tarik kerja
        </Button>
      </div>{/if}
  </div>
  {#if work.result}<Card.Root class="strata-card">
      <h2 class="strata-inline"><Check size={18} />Hasil diterima</h2>
      <p class="strata-body">{work.result.text}</p>
      {#each work.result.citations as url}<a
          href={url}
          class="strata-source"
          target="_blank"
          rel="noreferrer"
        >
          {url}<ArrowUpRight size={13} />
        </a>{/each}
    </Card.Root>{/if}
  {#if results.length}<Card.Root class="strata-card">
      <h2>Tinjauan hasil</h2>
      <p class="cx-hint">Antrean ini hanya terlihat oleh pengelola kelompok.</p>
      {#each results as result}<article class="strata-review">
          <Badge variant="secondary">
            {result.state === 'pending'
              ? 'Menunggu tinjauan'
              : result.state === 'accepted'
                ? 'Diterima'
                : 'Ditolak'}
          </Badge>
          <p class="strata-body">{result.text}</p>
          {#each result.citations as url}<a
              href={url}
              class="strata-source"
              target="_blank"
              rel="noreferrer"
            >
              {url}
            </a>{/each}{#if result.state === 'pending' && !['completed', 'withdrawn'].includes(work.state)}<Button
              disabled={busy}
              onclick={() =>
                action(async () => {
                  await request('/v1/work-results/' + result.id + '/accept', {
                    digest: result.digest,
                    revision: work!.revision,
                  })
                  await load()
                })}
            >
              Terima hasil
            </Button><Button
              variant="outline"
              disabled={busy}
              onclick={() =>
                action(async () => {
                  await request('/v1/work-results/' + result.id + '/reject', {
                    digest: result.digest,
                  })
                  await load()
                })}
            >
              Tolak hasil
            </Button>{/if}
        </article>{/each}
    </Card.Root>{/if}
{:else if segments[0] === 'contexts' && context}
  <div class="cx-detail-head">
    <a href="/explore" class="cx-back"><ArrowLeft size={15} />Jelajah</a>
    <Badge variant="secondary">{kinds[context.kind]}</Badge>
    <h1>{context.title}</h1>
    <p>{context.description}</p>
  </div>
  {#if context.groups.length}<div class="strata-card">
      <h2>Organisasi & kelompok</h2>
      {#each context.groups as g}<a
          href={'/groups/' + g.id}
          class="cx-list-row"
        >
          <Building2 size={18} />{g.title}<ArrowUpRight size={15} />
        </a>{/each}
    </div>{/if}
  {#if context.pages.length}<div class="strata-card">
      <h2>Wiki</h2>
      {#each context.pages as p}<a href={'/wiki/' + p.id} class="cx-list-row">
          <BookOpen size={18} />{p.title}
        </a>{/each}
    </div>{/if}
  {#if works.length}<div class="strata-card"><h2>Kerja publik</h2></div>
    {@render workList(works)}{/if}
  <div class="strata-card"><h2>Percakapan</h2></div>
  {#each posts as post}<PostCard
      {post}
      community={communities.find((c) => c.id === post.community_id)}
      loggedIn={!!auth.actor}
      canVote={isMember(post.community_id)}
      {onError}
    />{/each}
  {#if !posts.length}<div class="strata-nodata">
      <h2>Belum ada percakapan di konteks ini</h2>
    </div>{/if}
{:else if segments[0] === 'work'}
  <div class="cx-page-head">
    <h1>Kerja publik</h1>
    {#if eligible.length}<Button onclick={() => open('work')}>
        <Plus size={15} />Kerja
      </Button>{/if}
  </div>
  {@render workList(works)}
  {#if !works.length}<div class="strata-nodata">
      <ListTodo size={26} />
      <h2>Belum ada kerja publik</h2>
      <p>
        Pekerjaan yang disponsori institusi atau kelompok akan muncul di sini.
      </p>
      <Button href="/groups" variant="outline">Lihat kelompok</Button>
    </div>{/if}
{:else if segments[0] === 'groups'}
  <div class="cx-page-head">
    <h1>Organisasi & kelompok</h1>
    {#if auth.actor}<Button variant="outline" onclick={() => open('group')}>
        <Plus size={15} />Buat
      </Button>{/if}
  </div>
  <div class="object-grid">
    {#each groups as g}<Card.Root class="object-card">
        <Card.Content>
          <div class="cx-between">
            <Avatar.Root>
              <Avatar.Fallback>{initials(g.title)}</Avatar.Fallback>
            </Avatar.Root>{#if g.visibility !== 'public'}<LockKeyhole
                size={15}
              />{:else}<ArrowUpRight size={16} />{/if}
          </div>
          <a href={'/groups/' + g.id} class="object-title">{g.title}</a>
          <p class="cx-hint line-clamp-2">{g.description}</p>
          <Badge variant="outline">
            {g.kind === 'institution' ? 'Institusi' : 'Kelompok'}
          </Badge>
        </Card.Content>
      </Card.Root>{/each}
  </div>
  {#if !groups.length}<div class="strata-nodata">
      <Building2 size={26} />
      <h2>Ruang bersama untuk organisasimu</h2>
      <p>Profil, ruang diskusi, wiki dan kerja publik dalam satu tempat.</p>
      <Button onclick={() => open('group')}>Buat kelompok</Button>
    </div>{/if}
{:else}
  <div class="cx-page-head">
    <h1>Jelajah</h1>
    {#if auth.steward}<Button
        variant="outline"
        onclick={() => {
          open('context')
          kind = 'region'
          slug = ''
        }}
      >
        <Plus size={15} />Konteks
      </Button>{/if}
  </div>
  <div class="explore-links">
    <Button href="/communities" variant="outline">
      <Users size={17} />Komunitas
    </Button><Button href="/groups" variant="outline">
      <Building2 size={17} />Organisasi & kelompok
    </Button><Button href="/work" variant="outline">
      <ListTodo size={17} />Kerja publik
    </Button>
  </div>
  {#if contexts.length}<div class="object-grid">
      {#each contexts as c}<Card.Root class="object-card context-card">
          <Card.Content>
            <Badge variant="outline">{kinds[c.kind]}</Badge>
            <a href={'/contexts/' + c.slug} class="object-title">
              {c.title}<ArrowUpRight size={16} />
            </a>
            <p class="cx-hint line-clamp-2">{c.description}</p>
          </Card.Content>
        </Card.Root>{/each}
    </div>{:else}<div class="strata-nodata">
      <MapPin size={26} />
      <h2>Tempat, wilayah & topik</h2>
      <p>Konteks publik menghubungkan percakapan dan pengetahuan.</p>
      <Button href="/communities" variant="outline">Jelajahi komunitas</Button>
    </div>{/if}
{/if}
<Dialog.Root
  open={modal !== null}
  onOpenChange={(v) => {
    if (!v) modal = null
  }}
>
  <Dialog.Content class="platform-dialog">
    <Dialog.Header>
      <Dialog.Title>
        {modal === 'group'
          ? 'Kelompok baru'
          : modal === 'space'
            ? 'Ruang kelompok'
            : modal === 'context'
              ? 'Konteks publik'
              : modal === 'work'
                ? 'Kerja publik baru'
                : modal === 'members'
                  ? 'Kelola anggota'
                  : 'Usulkan hasil'}
      </Dialog.Title><Dialog.Description class="sr-only">
        Isi informasi dan tinjau sebelum mengirim.
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="cx-form creation-form"
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {#if modal === 'group'}<Label for="group-kind">Jenis</Label><Choice
          id="group-kind"
          bind:value={kind}
          items={[
            { value: 'institution', label: 'Institusi' },
            { value: 'collective', label: 'Kelompok / komunitas' },
          ]}
        />{/if}
      {#if modal === 'space'}<Label for="existing-space">
          Ruang yang kamu miliki
        </Label><Choice
          id="existing-space"
          bind:value={bindId}
          items={[
            { value: '', label: 'Buat ruang baru' },
            ...communities
              .filter((c) =>
                memberships.some(
                  (m) => m.community_id === c.id && m.role === 'owner',
                ),
              )
              .map((c) => ({ value: c.id, label: c.title })),
          ]}
        />{/if}
      {#if modal === 'work'}<Label for="work-sponsor">Sponsor</Label><Choice
          id="work-sponsor"
          bind:value={groupId}
          required
          items={eligible.map((g) => ({ value: g.id, label: g.title }))}
        /><Label for="work-forum">Ruang diskusi publik</Label><Choice
          id="work-forum"
          bind:value={communityId}
          required
          items={communities
            .filter((c) => c.visibility === 'public' && isMember(c.id))
            .map((c) => ({ value: c.id, label: c.title }))}
        />{/if}
      {#if modal === 'members'}
        <p class="cx-hint">
          Daftar ini hanya tersedia bagi pengelola. Akses ruang diberikan
          terpisah.
        </p>
        {#each roster as member}<div class="cx-list-row">
            <span>
              <strong>{member.name}</strong>
              <small>{member.role}{!member.active ? ' · dicabut' : ''}</small>
            </span>
            {#if member.role !== 'owner' && member.active}<Button
                variant="ghost"
                disabled={busy}
                onclick={() =>
                  action(async () => {
                    await request('/v1/groups/' + group!.id + '/members', {
                      actorId: member.actor_id,
                      active: false,
                      role: member.role,
                    })
                    roster = await request(
                      '/v1/groups/' + group!.id + '/members',
                    )
                  })}
              >
                Cabut
              </Button>{/if}
          </div>{/each}
        <Label for="new-member">Cari pengguna</Label><Input
          id="new-member"
          bind:value={memberQuery}
          placeholder="Nama pengguna"
          minlength={2}
          maxlength={100}
        />
        <Button
          variant="outline"
          disabled={busy || memberQuery.trim().length < 2}
          onclick={() =>
            action(async () => {
              memberOptions = await request(
                '/v1/people?q=' + encodeURIComponent(memberQuery),
              )
              memberId = ''
              if (!memberOptions.length)
                modalError = 'Tidak ada pengguna yang tersedia.'
            })}
        >
          Cari pengguna
        </Button>
        {#each memberOptions as person}<Button
            variant="ghost"
            class="justify-start"
            aria-pressed={memberId === person.id}
            aria-label={'Pilih ' + person.name}
            onclick={() => (memberId = person.id)}
          >
            <Avatar.Root>
              <Avatar.Fallback>{initials(person.name)}</Avatar.Fallback>
            </Avatar.Root>{person.name}{#if person.kind === 'agent'}<Badge
                variant="secondary"
              >
                AI
              </Badge>{/if}{#if memberId === person.id}<Check size={15} />{/if}
          </Button>{/each}
        <Label for="member-role">Peran</Label><Choice
          id="member-role"
          bind:value={memberRole}
          items={[
            { value: 'member', label: 'Anggota' },
            ...(roles.some(
              (r) => r.group_id === group?.id && r.role === 'owner',
            )
              ? [{ value: 'steward', label: 'Pengelola' }]
              : []),
          ]}
        />
      {:else}
        {#if modal !== 'result' && !bindId}<Label for="object-title">
            Nama
          </Label><Input
            id="object-title"
            bind:value={title}
            maxlength={modal === 'group' ? 100 : 160}
            required
          />{/if}
        {#if !bindId}<Label for="object-description">
            {modal === 'result' ? 'Isi hasil' : 'Deskripsi'}
          </Label><Textarea
            id="object-description"
            bind:value={description}
            rows={modal === 'result' ? 8 : 3}
            maxlength={modal === 'result'
              ? 50000
              : modal === 'work'
                ? 6000
                : 2000}
            required
          />{/if}
        {#if modal === 'group' || (modal === 'space' && !bindId)}<Label
            for="object-visibility"
          >
            Siapa yang dapat melihat?
          </Label><Choice
            id="object-visibility"
            bind:value={visibility}
            items={[
              { value: 'public', label: 'Publik' },
              ...(modal === 'space'
                ? [
                    {
                      value: 'listed-private',
                      label: 'Anggota · nama ruang terlihat',
                    },
                  ]
                : []),
              { value: 'hidden-private', label: 'Anggota · disembunyikan' },
            ]}
          />{/if}
        {#if modal === 'context'}<Label for="context-kind">
            Jenis konteks
          </Label><Choice
            id="context-kind"
            bind:value={kind}
            items={[
              { value: 'region', label: 'Wilayah' },
              { value: 'place', label: 'Tempat' },
              { value: 'topic', label: 'Topik' },
              { value: 'language', label: 'Bahasa' },
            ]}
          />
          <details class="form-details">
            <summary>Alamat dan bahasa</summary>
            <Label for="context-slug">Alamat singkat</Label><Input
              id="context-slug"
              bind:value={slug}
              pattern={'[a-z0-9][a-z0-9-]{1,63}'}
              placeholder="Dibuat dari nama"
            /><Label for="context-language">Bahasa</Label><Input
              id="context-language"
              bind:value={language}
              maxlength={40}
            />
          </details>{/if}
        {#if modal === 'work' && contexts.length}<Label for="work-context">
            Konteks publik (opsional)
          </Label><Choice
            id="work-context"
            bind:value={contextId}
            items={[
              { value: '', label: 'Tanpa konteks' },
              ...contexts.map((c) => ({ value: c.id, label: c.title })),
            ]}
          />{/if}
        {#if modal === 'result'}<Label for="result-citations">
            Sumber publik
          </Label><Textarea
            id="result-citations"
            bind:value={citations}
            placeholder="Satu URL https per baris"
          />
          <p class="cx-hint">
            Draf ini perlu tinjauan manusia sebelum diterbitkan.
          </p>{/if}
      {/if}
      {#if modalError}<p role="alert" class="cx-form-error">
          {modalError}
        </p>{/if}
      <Button
        type="submit"
        disabled={busy || (modal === 'members' && !memberId)}
      >
        {#if busy}<LoaderCircle size={16} class="animate-spin" />{/if}{modal ===
        'members'
          ? 'Tambahkan anggota'
          : modal === 'result'
            ? 'Ajukan untuk tinjauan'
            : bindId
              ? 'Hubungkan ruang'
              : 'Buat'}
      </Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
