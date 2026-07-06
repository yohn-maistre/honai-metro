<script lang="ts">
  import { t } from '$lib/app/i18n'
  import PetaPapua from '$lib/etnos/PetaPapua.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge } from 'mono-svelte'
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
  <title>{$t('routes.explore.title')} — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <div
    class="bg-white dark:bg-zinc-900 rounded p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <PetaPapua {instances} />
  </div>

  <section class="flex flex-col gap-3">
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2">
        <Icon src={Sparkles} size="18" class="text-primary-600 dark:text-primary-400" />
        <h2 class="text-lg font-semibold font-display dark:text-white">
          {$t('etnos.explore.sorotan')}
        </h2>
      </div>
      <div class="rule2 is-drawn"></div>
    </div>
    <p class="text-sm text-slate-500 dark:text-zinc-400">
      {$t('etnos.explore.sorotan_subtitle')}
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
      {#each data.sorotan.highlights as h (h.id)}
        {@const isPrimary = h.kind === 'primary'}
        {@const accent = h.accent ?? 'primary'}
        <a
          href={h.href}
          class={[
            'rounded-2xl p-4 shadow-sm border transition-colors flex flex-col gap-2',
            isPrimary
              ? 'sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-zinc-900 border-primary-200/70 dark:border-primary-900/50 hover:border-primary-400 dark:hover:border-primary-600'
              : accent === 'amber'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600'
                : accent === 'emerald'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600',
          ]}
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
            class={[
              'inline-flex items-center gap-1 text-xs font-medium mt-1',
              accent === 'amber'
                ? 'text-amber-700 dark:text-amber-300'
                : accent === 'emerald'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-primary-600 dark:text-primary-400',
            ]}
          >
            {$t('etnos.explore.sorotan_open')}
            <Icon src={ArrowRight} micro size="14" />
          </span>
        </a>
      {/each}
    </div>
  </section>

  {#each data.directory.groups as group (group.category)}
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">{group.icon}</span>
        <h3 class="text-base font-semibold font-display dark:text-white">{group.category}</h3>
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
          <a
            href="/c/{c.slug}"
            class={[
              'rounded-2xl p-4 shadow-sm border transition-colors flex items-start gap-3',
              group.stronghold
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600'
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600',
            ]}
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
          </a>
        {/each}
      </div>
    </section>
  {/each}

  <EndPlaceholder margin="md">
    {$t('etnos.explore.browse_all')}
  </EndPlaceholder>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <a
      href="/explore/communities"
      class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-center gap-3"
    >
      <span class="font-medium dark:text-white">
        {$t('etnos.explore.browse_communities')}
      </span>
      <Icon src={ArrowRight} micro size="16" class="ml-auto text-slate-400" />
    </a>
    <a
      href="/explore/feeds"
      class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-center gap-3"
    >
      <span class="font-medium dark:text-white">
        {$t('etnos.explore.browse_feeds')}
      </span>
      <Icon src={ArrowRight} micro size="16" class="ml-auto text-slate-400" />
    </a>
    <a
      href="/explore/topics"
      class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-center gap-3"
    >
      <span class="font-medium dark:text-white">
        {$t('etnos.explore.browse_topics')}
      </span>
      <Icon src={ArrowRight} micro size="16" class="ml-auto text-slate-400" />
    </a>
  </div>
</div>
