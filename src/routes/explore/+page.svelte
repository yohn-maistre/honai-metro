<script lang="ts">
  import { t } from '$lib/app/i18n'
  import bahasa from '$lib/etnos/data/bahasa.json'
  import PetaSimpul from '$lib/etnos/PetaSimpul.svelte'
  import SorotanBoard from '$lib/etnos/SorotanBoard.svelte'
  import { Figure, PageHeader, SectionHead } from '$lib/etnos/ui'
  import { Badge, TextInput } from 'mono-svelte'
  import {
    ArrowRight,
    ArrowTopRightOnSquare,
    Icon,
    MagnifyingGlass,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

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

  <div
    class="grid grid-cols-3 gap-x-6 border-y border-slate-200/70 dark:border-zinc-800 py-4"
  >
    {#each [{ n: totalKomunitas, label: $t('etnos.explore.stats.komunitas') }, { n: data.directory.groups.length, label: $t('etnos.explore.stats.kategori') }, { n: bahasa.languages.length, label: $t('etnos.explore.stats.bahasa') }] as s (s.label)}
      <Figure value={s.n} label={s.label} />
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
    <section class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <SectionHead title={group.category}>
          {#snippet action()}
            <Badge>{group.communities.length}</Badge>
            {#if group.stronghold}
              <Badge color="yellow-subtle">{$t('etnos.explore.unggulan')}</Badge>
            {/if}
          {/snippet}
        </SectionHead>
        <p class="text-sm text-slate-500 dark:text-zinc-400">
          {group.description}
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
        {#each group.communities as c (c.slug)}
          <a
            href="/c/{c.slug}"
            class="group flex items-start gap-3 no-underline py-2.5 border-b border-slate-200/60 dark:border-zinc-800"
          >
            <div
              class={[
                'w-9 h-9 rounded-xl shrink-0 grid place-items-center font-bold',
                'bg-slate-100 dark:bg-zinc-800',
                group.stronghold
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-zinc-300',
              ]}
            >
              {c.name.charAt(0)}
            </div>
            <div class="flex flex-col gap-0.5 min-w-0">
              <span
                class="font-medium dark:text-white truncate transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
              >
                {c.name}
              </span>
              <span class="text-xs text-slate-500 dark:text-zinc-400 truncate">
                /c/{c.slug}{#if c.subtitle}{' · '}{c.subtitle}{/if}
              </span>
            </div>
            <Icon
              src={ArrowTopRightOnSquare}
              micro
              size="14"
              class="ml-auto text-slate-400 dark:text-zinc-500 mt-1 shrink-0"
            />
          </a>
        {/each}
      </div>
    </section>
  {/each}

  <SorotanBoard />

  <section class="flex flex-col gap-2">
    <SectionHead title={$t('etnos.explore.browse_all')} />
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
      {#each [{ href: '/explore/communities', label: $t('etnos.explore.browse_communities') }, { href: '/explore/feeds', label: $t('etnos.explore.browse_feeds') }, { href: '/explore/topics', label: $t('etnos.explore.browse_topics') }] as link (link.href)}
        <a
          href={link.href}
          class="group flex items-center gap-3 no-underline py-2.5 border-b border-slate-200/60 dark:border-zinc-800"
        >
          <span
            class="font-medium dark:text-white transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
          >
            {link.label}
          </span>
          <Icon
            src={ArrowRight}
            micro
            size="16"
            class="ml-auto text-slate-400"
          />
        </a>
      {/each}
    </div>
  </section>
</div>
