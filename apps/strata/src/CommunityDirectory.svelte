<script lang="ts">
  import {
    Users,
    Building2,
    ArrowUpRight,
    Plus,
    Search,
    Globe,
    LockKeyhole,
  } from '@lucide/svelte'
  import { untrack } from 'svelte'
  import {
    request,
    initials,
    type Auth,
    type Community,
    type Membership,
  } from './api'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  let {
    auth,
    communities,
    memberships,
    organizations = false,
    onCreate,
    navigate,
  }: {
    auth: Auth
    communities: Community[]
    memberships: Membership[]
    organizations?: boolean
    onCreate: () => void
    navigate: (s: string) => void
  } = $props()
  let mode = $state(untrack(() => (organizations ? 'organizations' : 'rooms'))),
    query = $state(''),
    groups = $state<
      { id: string; title: string; description: string; kind: string }[]
    >([]),
    error = $state('')
  $effect(() => {
    const actor = auth.actor?.id,
      abort = new AbortController()
    groups = []
    error = ''
    request<typeof groups>('/v1/groups', undefined, abort.signal)
      .then((rows) => {
        if (!abort.signal.aborted && actor === auth.actor?.id) groups = rows
      })
      .catch((e) => {
        if (!abort.signal.aborted) error = e.message
      })
    return () => abort.abort()
  })
  const rooms = $derived(
    communities.filter(
      (c) =>
        (mode !== 'joined' ||
          memberships.some((m) => m.community_id === c.id)) &&
        (c.title + ' ' + c.description)
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    ),
  )
  const organizationsList = $derived(
    groups.filter((g) =>
      (g.title + ' ' + g.description)
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    ),
  )
</script>

<section class="community-directory">
  <div class="directory-intro">
    <div>
      <h1>Temukan ruangmu</h1>
      <p>Percakapan, organisasi & pengetahuan bersama.</p>
    </div>
    <Button
      variant="outline"
      aria-label={mode === 'organizations'
        ? 'Buat organisasi'
        : 'Buat komunitas'}
      onclick={() =>
        mode === 'organizations' ? navigate('/groups?create=true') : onCreate()}
    >
      <Plus size={16} />Buat
    </Button>
  </div>
  <nav class="directory-tabs" aria-label="Direktori komunitas">
    {#each [['rooms', 'Ruang'], ['organizations', 'Organisasi'], ['joined', 'Diikuti']] as [value, label]}<button
        aria-current={mode === value ? 'page' : undefined}
        onclick={() => (mode = value)}
      >
        {label}
      </button>{/each}
  </nav>
  <label class="directory-search">
    <Search size={18} /><Input
      aria-label="Cari di direktori"
      placeholder={mode === 'organizations'
        ? 'Cari organisasi…'
        : 'Cari komunitas…'}
      bind:value={query}
    />
  </label>
  {#if mode === 'organizations'}{#if error}<p role="alert" class="search-state">
        {error}
      </p>{/if}{#each organizationsList as group}<a
        href={'/groups/' + group.id}
        class="directory-row"
      >
        <span class="directory-avatar"><Building2 size={22} /></span>
        <div>
          <strong>{group.title}</strong>
          <p>{group.description}</p>
          <small>
            {group.kind === 'institution' ? 'Institusi' : 'Kolektif'}
          </small>
        </div>
        <ArrowUpRight size={17} />
      </a>{/each}{#if !organizationsList.length && !error}<p
        class="search-state"
      >
        Belum ada organisasi yang cocok.
      </p>{/if}
  {:else}{#each rooms as community}<a
        href={'/communities/' + community.id}
        class="directory-row"
      >
        <span class="directory-avatar">{initials(community.title)}</span>
        <div>
          <strong>{community.title}</strong>
          <p>{community.description}</p>
          <small>
            {#if community.visibility === 'public'}<Globe
                size={12}
              />Publik{:else}<LockKeyhole size={12} />Khusus anggota{/if}{#if memberships.some((m) => m.community_id === community.id)}
              · Anggota{/if}
          </small>
        </div>
        <ArrowUpRight size={17} />
      </a>{/each}{#if !rooms.length}<div class="search-state">
        <Users size={25} />
        <p>
          {mode === 'joined'
            ? 'Ruang yang kamu ikuti akan muncul di sini.'
            : 'Belum ada komunitas yang cocok.'}
        </p>
      </div>{/if}{/if}
</section>
