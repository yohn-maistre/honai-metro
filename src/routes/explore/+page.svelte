<script lang="ts">
  import { t } from '$lib/app/i18n'
  import KilasTicker from '$lib/etnos/KilasTicker.svelte'
  import PapanKilas from '$lib/etnos/PapanKilas.svelte'
  import PetaPapua from '$lib/etnos/PetaPapua.svelte'
  import SorotanBoard from '$lib/etnos/SorotanBoard.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge, Material } from 'mono-svelte'
  import {
    ArrowRight,
    ArrowTopRightOnSquare,
    Icon,
    Sparkles,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  // Map any province code → ETNOS instance URL once those go live.
  const instances: Record<string, string> = {}
</script>

<svelte:head>
  <title>{$t('routes.explore.title')} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <KilasTicker />

  <PapanKilas />

  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <PetaPapua {instances} />
  </div>

  <SorotanBoard />

  <section class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <Icon src={Sparkles} size="18" class="text-primary-600 dark:text-primary-400" />
      <h2 class="text-lg font-semibold dark:text-white">
        {$t('etnos.explore.sorotan')}
      </h2>
    </div>
    <p class="text-sm text-slate-500 dark:text-zinc-400">
      {$t('etnos.explore.sorotan_subtitle')}
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
      {#each data.sorotan.highlights as h (h.id)}
        {@const isPrimary = h.kind === 'primary'}
        <Material
          element="a"
          href={h.href}
          color="default"
          rounding="2xl"
          padding="md"
          class="flex flex-col gap-2 no-underline {isPrimary
            ? 'sm:col-span-2 lg:col-span-1'
            : ''}"
        >
          <div class="flex items-start gap-2">
            <span class="text-2xl shrink-0" aria-hidden="true">{h.icon}</span>
            <span class="font-semibold dark:text-white leading-tight">
              {h.title}
            </span>
          </div>
          <p class="text-sm text-slate-600 dark:text-zinc-400 leading-snug">
            {h.subtitle}
          </p>
          <span
            class="inline-flex items-center gap-1 text-xs font-medium mt-1 text-primary-600 dark:text-primary-400"
          >
            {$t('etnos.explore.sorotan_open')}
            <Icon src={ArrowRight} micro size="14" />
          </span>
        </Material>
      {/each}
    </div>
  </section>

  {#each data.directory.groups as group (group.category)}
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">{group.icon}</span>
        <h3 class="text-base font-semibold dark:text-white">{group.category}</h3>
        <Badge color={group.stronghold ? 'yellow-subtle' : 'gray-subtle'} rounding="md">
          {group.communities.length}
        </Badge>
        {#if group.stronghold}
          <Badge color="yellow-subtle" rounding="md">Stronghold</Badge>
        {/if}
        <span class="text-sm text-slate-500 dark:text-zinc-400 ml-2">
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
            class="flex items-start gap-3 no-underline"
          >
            <div
              class={[
                'w-10 h-10 rounded-xl shrink-0 grid place-items-center font-bold',
                group.stronghold
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
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
        class="flex items-center gap-3 no-underline"
      >
        <span class="font-medium dark:text-white">{link.label}</span>
        <Icon src={ArrowRight} micro size="16" class="ml-auto text-slate-400" />
      </Material>
    {/each}
  </div>
</div>
