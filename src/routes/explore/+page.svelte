<script lang="ts">
  import { t } from '$lib/app/i18n'
  import SorotanBoard from '$lib/etnos/SorotanBoard.svelte'
  import { IconTile, PageHeader } from '$lib/etnos/ui'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge, Material } from 'mono-svelte'
  import {
    ArrowRight,
    ArrowTopRightOnSquare,
    BuildingLibrary,
    ChatBubbleLeftRight,
    CpuChip,
    ComputerDesktop,
    HomeModern,
    Icon,
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
</script>

<svelte:head>
  <title>{$t('routes.explore.title')} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <PageHeader
    title={$t('routes.explore.title')}
    lede={$t('etnos.explore.lede')}
  />

  {#each data.directory.groups as group (group.category)}
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
