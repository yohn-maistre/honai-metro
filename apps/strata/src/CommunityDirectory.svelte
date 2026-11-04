<script lang="ts">
  import {
    Users,
    Building2,
    ArrowUpRight,
    Plus,
    Search,
    Globe,
    LockKeyhole,
    MapPin,
    Hash,
  } from '@lucide/svelte'
  import {
    request,
    initials,
    type Auth,
    type Community,
    type Membership,
  } from './api'
  import Choice from './Choice.svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import { tabScroll } from './tab-scroll'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  type View = 'rooms' | 'organizations' | 'places' | 'topics' | 'joined'
  type Place = {
    id: string
    slug: string
    title: string
    description: string
    kind: string
  }
  type Group = {
    id: string
    title: string
    description: string
    kind: string
    spaces?: Community[]
    contexts?: Place[]
  }
  let {
    auth,
    communities,
    memberships,
    view = 'rooms',
    onCreate,
    navigate,
  }: {
    auth: Auth
    communities: Community[]
    memberships: Membership[]
    view?: View
    onCreate: () => void
    navigate: (url: string) => void
  } = $props()
  let query = $state(''),
    organization = $state(''),
    placeKind = $state(''),
    groups = $state<Group[]>([]),
    places = $state<Place[]>([]),
    error = $state(''),
    pending = $state(true)
  const kindNames: Record<string, string> = {
    region: 'Wilayah',
    place: 'Tempat',
    language: 'Bahasa',
    topic: 'Topik',
  }
  $effect(() => {
    const actor = auth.actor?.id,
      abort = new AbortController()
    groups = []
    places = []
    error = ''
    pending = true
    Promise.all([
      request<Group[]>('/v1/groups', undefined, abort.signal),
      request<Place[]>('/v1/contexts', undefined, abort.signal),
    ])
      .then(([gs, ps]) => {
        if (!abort.signal.aborted && actor === auth.actor?.id) {
          groups = gs
          places = ps
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) error = e.message
      })
      .finally(() => {
        if (!abort.signal.aborted) pending = false
      })
    return () => abort.abort()
  })
  const match = (title: string, description = '') =>
    (title + ' ' + description)
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase())
  const rooms = $derived(
    communities.filter(
      (c) =>
        (view !== 'joined' ||
          memberships.some((m) => m.community_id === c.id)) &&
        match(c.title, c.description) &&
        (!organization ||
          groups
            .find((g) => g.id === organization)
            ?.spaces?.some((s) => s.id === c.id)),
    ),
  )
  const selectedGroups = $derived(
    groups.filter(
      (g) =>
        (!organization || g.id === organization) &&
        g.spaces?.some((s) => rooms.some((c) => c.id === s.id)),
    ),
  )
  const ungrouped = $derived(
    rooms.filter(
      (c) => !groups.some((g) => g.spaces?.some((s) => s.id === c.id)),
    ),
  )
  const organizationsList = $derived(
    groups.filter((g) => match(g.title, g.description)),
  )
  const placesList = $derived(
    places.filter(
      (p) =>
        (view === 'topics' ? p.kind === 'topic' : p.kind !== 'topic') &&
        (!placeKind || p.kind === placeKind) &&
        match(p.title, p.description),
    ),
  )
  function create() {
    if (!auth.actor) {
      navigate('/login')
      return
    }
    if (view === 'organizations') navigate('/groups?create=true')
    else if (view === 'topics') navigate('/contexts?create=true&kind=topic')
    else if (view === 'places') navigate('/contexts?create=true')
    else onCreate()
  }
</script>

<section class="community-directory" aria-label="Direktori">
  <div class="directory-controls">
    <nav class="directory-tabs" aria-label="Direktori komunitas" use:tabScroll>
      {#each [['rooms', 'Komunitas', '/communities'], ['topics', 'Topik', '/topics'], ['places', 'Tempat & bahasa', '/contexts'], ['organizations', 'Organisasi', '/groups']] as [id, label, url]}
        <button
          aria-current={view === id || (view === 'joined' && id === 'rooms')
            ? 'page'
            : undefined}
          onclick={() => navigate(url)}
        >
          {label}
        </button>
      {/each}
    </nav>
    {#if !['places', 'topics'].includes(view) || auth.steward}<Button
        variant="outline"
        aria-label={view === 'organizations'
          ? 'Buat organisasi'
          : view === 'topics'
            ? 'Buat topik'
            : view === 'places'
              ? 'Buat tempat atau bahasa'
              : 'Buat komunitas'}
        onclick={create}
      >
        <Plus size={16} />Buat
      </Button>{/if}
  </div>
  <div class="directory-filters">
    <div class="directory-input-row">
      <label class="directory-search">
        <Search size={18} /><Input
          aria-label="Cari di direktori"
          placeholder={view === 'organizations'
            ? 'Cari organisasi…'
            : view === 'topics'
              ? 'Cari topik…'
              : view === 'places'
                ? 'Cari tempat atau bahasa…'
                : 'Cari komunitas…'}
          bind:value={query}
        />
      </label>
      {#if auth.actor && (view === 'rooms' || view === 'joined')}<Button
          variant={view === 'joined' ? 'secondary' : 'outline'}
          aria-pressed={view === 'joined'}
          onclick={() =>
            navigate(
              view === 'joined' ? '/communities' : '/communities?view=joined',
            )}
        >
          Diikuti
        </Button>{/if}
    </div>
    {#if (view === 'rooms' || view === 'joined') && groups.length}<Choice
        aria-label="Organisasi komunitas"
        bind:value={organization}
        items={[
          { value: '', label: 'Semua organisasi' },
          ...groups.map((g) => ({ value: g.id, label: g.title })),
        ]}
      />{/if}
    {#if view === 'places'}<Choice
        aria-label="Jenis tempat dan konteks"
        bind:value={placeKind}
        items={[
          { value: '', label: 'Semua jenis' },
          ...Object.entries(kindNames)
            .filter(([value]) => value !== 'topic')
            .map(([value, label]) => ({
              value,
              label,
            })),
        ]}
      />{/if}
  </div>
  {#if pending && (view === 'organizations' || view === 'places' || view === 'topics')}<ContentSkeleton
      rows={2}
    />{/if}
  {#if error}<p role="alert" class="search-state">{error}</p>{/if}
  {#if view === 'organizations'}
    {#each organizationsList as group}<a
        href={'/groups/' + group.id}
        class="directory-row"
      >
        <span class="directory-avatar"><Building2 size={22} /></span>
        <div>
          <strong>{group.title}</strong>
          <p>{group.description}</p>
          <small>
            {group.kind === 'institution' ? 'Institusi' : 'Kelompok'}
          </small>
        </div>
        <ArrowUpRight size={17} />
      </a>{/each}
    {#if !organizationsList.length && !pending && !error}<p
        class="search-state"
      >
        Belum ada organisasi yang cocok.
      </p>{/if}
  {:else if view === 'places' || view === 'topics'}
    {#each placesList as place}<a
        href={'/contexts/' + place.slug}
        class="directory-row"
      >
        <span class="directory-avatar">
          {#if place.kind === 'topic'}<Hash size={22} />{:else}<MapPin
              size={22}
            />{/if}
        </span>
        <div>
          <strong>{place.title}</strong>
          {#if place.description}<p>{place.description}</p>{/if}
          {#if view !== 'topics'}<small>
              {kindNames[place.kind] ?? place.kind}
            </small>{/if}
        </div>
        <ArrowUpRight size={17} />
      </a>{/each}
    {#if !placesList.length && !pending && !error}<div
        class="search-state directory-empty"
      >
        <MapPin size={24} />
        <p>
          {view === 'topics'
            ? query
              ? 'Belum ada topik yang cocok.'
              : 'Belum ada topik.'
            : query
              ? 'Belum ada tempat atau bahasa yang cocok.'
              : 'Belum ada tempat atau bahasa yang ditautkan.'}
        </p>
        <a href="/communities">Jelajahi komunitas</a>
      </div>{/if}
  {:else}
    {#each selectedGroups as group}<section class="directory-section">
        <h2>
          <Building2 size={16} />
          <a href={'/groups/' + group.id}>{group.title}</a>
        </h2>
        {#each rooms.filter( (c) => group.spaces?.some((s) => s.id === c.id) ) as room}{@render roomRow(
            room,
          )}{/each}
      </section>{/each}
    {#if ungrouped.length}<section class="directory-section">
        {#if selectedGroups.length}<h2>
            Komunitas lain
          </h2>{/if}{#each ungrouped as room}{@render roomRow(room)}{/each}
      </section>{/if}
    {#if !rooms.length && !pending}<div class="search-state directory-empty">
        <Users size={25} />
        <p>
          {view === 'joined'
            ? 'Ruang yang kamu ikuti akan muncul di sini.'
            : 'Belum ada komunitas yang cocok.'}
        </p>
      </div>{/if}
  {/if}
</section>
{#snippet roomRow(room: Community)}
  <a href={'/communities/' + room.id} class="directory-row">
    <span class="directory-avatar">{initials(room.title)}</span>
    <div>
      <strong>{room.title}</strong>
      <p>{room.description}</p>
      <small>
        {#if room.visibility === 'public'}<Globe
            size={12}
          />Publik{:else}<LockKeyhole size={12} />Khusus anggota{/if}{#if memberships.some((m) => m.community_id === room.id)}
          · Anggota{/if}
      </small>
    </div>
    <ArrowUpRight size={17} />
  </a>
{/snippet}
