<script lang="ts">
  import { t } from '$lib/app/i18n'
  import bahasa from '$lib/etnos/data/bahasa.json'
  import PetaSimpul from '$lib/etnos/PetaSimpul.svelte'
  import SorotanBoard from '$lib/etnos/SorotanBoard.svelte'
  import { IconTile, PageHeader } from '$lib/etnos/ui'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge, Material, TextInput } from 'mono-svelte'
  import {
    ArrowRight,
    ArrowTopRightOnSquare,
    BuildingLibrary,
    ChatBubbleLeftRight,
    CpuChip,
    ComputerDesktop,
    HomeModern,
    Icon,
    MagnifyingGlass,
    MusicalNote,
    Newspaper,
    Trophy,
    UserGroup,
    BookOpen,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  // Cluster icons: hero-icons keyed by category (JSON emoji retired).
  const clusterIcon: Record<string, typeof UserGroup> = {
    Adat: HomeModern,
    Bahasa: ChatBubbleLeftRight,
    Berita: Newspaper,
    Sport: Trophy,
    Teknologi: ComputerDesktop,
    Musik: MusicalNote,
    Pemerintah: BuildingLibrary,
    Wiki: BookOpen,
    AI: CpuChip,
  }

  let q = $state('')
  let kategori = $state<string | null>(null)

  const totalKomunitas = data.directory.groups.reduce(
    (n: number, g: { communities: unknown[] }) => n + g.communities.length,
    0,
  )

  // One community, every region: kab nama -> count, feeds the plate.
  const regionCounts: Record<string, number> = {}
  for (const g of data.directory.groups)
    for (const c of g.communities)
      if (c.region) regionCounts[c.region] = (regionCounts[c.region] ?? 0) + 1

  const filtered = $derived.by(() => {
    const needle = q.trim().toLowerCase()
    return data.directory.groups
      .filter(
        (g: { category: string }) => !kategori || g.category === kategori,
      )
      .map((g: { communities: { name: string; slug: string; subtitle?: string }[] }) => ({
        ...g,
        communities: needle
          ? g.communities.filter((c) =>
              [c.name, c.slug, c.subtitle ?? '']
                .join(' ')
                .toLowerCase()
                .includes(needle),
            )
          : g.communities,
      }))
      .filter((g: { communities: unknown[] }) => g.communities.length > 0)
  })
</script>

<svelte:head>
  <title>{$t('routes.explore.title')} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <PageHeader
    title={$t('routes.explore.title')}
    lede={$t('etnos.explore.lede')}
  />

  <PetaSimpul {regionCounts} />

  <div class="grid grid-cols-3 gap-3">
    {#each [{ n: totalKomunitas, label: $t('etnos.explore.stats.komunitas') }, { n: data.directory.groups.length, label: $t('etnos.explore.stats.kategori') }, { n: bahasa.languages.length, label: $t('etnos.explore.stats.bahasa') }] as s (s.label)}
      <Material color="default" rounding="2xl" padding="md" class="flex flex-col gap-0.5">
        <span class="text-2xl font-bold tabular-nums dark:text-white">
          {s.n}
        </span>
        <span class="text-xs text-slate-500 dark:text-zinc-400">{s.label}</span>
      </Material>
    {/each}
  </div>

  <div class="flex flex-col gap-3">
    <TextInput
      bind:value={q}
      placeholder={$t('etnos.explore.search')}
      aria-label={$t('etnos.explore.search')}
    >
      {#snippet prefix()}
        <Icon src={MagnifyingGlass} size="15" micro />
      {/snippet}
    </TextInput>
    <div class="flex gap-1.5 overflow-x-auto">
      <button
        type="button"
        class={[
          'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          kategori === null
            ? 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950'
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700',
        ]}
        onclick={() => (kategori = null)}
      >
        {$t('etnos.explore.filter_all')}
      </button>
      {#each data.directory.groups as g (g.category)}
        <button
          type="button"
          class={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            kategori === g.category
              ? 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700',
          ]}
          onclick={() => (kategori = kategori === g.category ? null : g.category)}
        >
          {g.category}
          <span class="opacity-60 tabular-nums ml-0.5">
            {g.communities.length}
          </span>
        </button>
      {/each}
    </div>
  </div>

  {#if filtered.length === 0}
    <p class="text-sm text-slate-500 dark:text-zinc-400">
      {$t('etnos.explore.empty')}
    </p>
  {/if}

  {#each filtered as group (group.category)}
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2.5 flex-wrap">
        <IconTile icon={clusterIcon[group.category] ?? UserGroup} size="sm" />
        <h2 class="text-base font-semibold dark:text-white">
          {group.category}
        </h2>
        <Badge>{group.communities.length}</Badge>
        {#if group.stronghold}
          <Badge color="yellow-subtle">{$t('etnos.explore.unggulan')}</Badge>
        {/if}
        <span class="text-sm text-slate-500 dark:text-zinc-400 ml-1">
          {group.description}
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each group.communities as c (c.slug)}
          <Material
            element="a"
            href="/c/{c.slug}"
            color="default"
            rounding="2xl"
            padding="md"
            interactive
            class="flex items-start gap-3 no-underline"
          >
            <div
              class={[
                'w-10 h-10 rounded-xl shrink-0 grid place-items-center font-bold',
                'bg-slate-100 dark:bg-zinc-800',
                group.stronghold
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-zinc-300',
              ]}
            >
              {c.name.charAt(0)}
            </div>
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="font-medium dark:text-white truncate">
                {c.name}
              </span>
              <span class="text-xs text-slate-500 dark:text-zinc-400 truncate">
                /c/{c.slug}
              </span>
              {#if c.subtitle}
                <span class="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  {c.subtitle}
                </span>
              {/if}
            </div>
            <Icon
              src={ArrowTopRightOnSquare}
              micro
              size="14"
              class="ml-auto text-slate-400 dark:text-zinc-500 mt-1"
            />
          </Material>
        {/each}
      </div>
    </section>
  {/each}

  <SorotanBoard />

  <EndPlaceholder margin="md">
    {$t('etnos.explore.browse_all')}
  </EndPlaceholder>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {#each [{ href: '/explore/communities', label: $t('etnos.explore.browse_communities') }, { href: '/explore/feeds', label: $t('etnos.explore.browse_feeds') }, { href: '/explore/topics', label: $t('etnos.explore.browse_topics') }] as link (link.href)}
      <Material
        element="a"
        href={link.href}
        color="default"
        rounding="2xl"
        padding="md"
        interactive
        class="flex items-center gap-3 no-underline"
      >
        <span class="font-medium dark:text-white">{link.label}</span>
        <Icon src={ArrowRight} micro size="16" class="ml-auto text-slate-400" />
      </Material>
    {/each}
  </div>
</div>
