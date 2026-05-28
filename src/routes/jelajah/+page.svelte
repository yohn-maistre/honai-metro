<script lang="ts">
  import { t } from '$lib/app/i18n'
  import PapuaMap from '$lib/etnos/PapuaMap.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge } from 'mono-svelte'
  import { ArrowTopRightOnSquare, Icon } from 'svelte-hero-icons/dist'

  let { data } = $props()

  // Map any province code → ETNOS instance URL once those go live.
  // Empty for now; demo PapuaMap renders all provinces as "no instance yet".
  const instances: Record<string, string> = {}
</script>

<svelte:head>
  <title>{$t('etnos.directory.title')} — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <EndPlaceholder size="lg">{$t('etnos.directory.title')}</EndPlaceholder>
  <p class="text-sm text-slate-500 dark:text-zinc-400">
    {$t('etnos.directory.subtitle')}
  </p>

  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <PapuaMap {instances} />
  </div>

  {#each data.directory.groups as group (group.category)}
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">{group.icon}</span>
        <h2 class="text-lg font-semibold dark:text-white">{group.category}</h2>
        <Badge color="gray-subtle" rounding="md">
          {group.communities.length}
        </Badge>
        <span class="text-sm text-slate-500 dark:text-zinc-400 ml-2">
          {group.description}
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each group.communities as c (c.slug)}
          <a
            href="/c/{c.slug}"
            class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800
                   hover:border-primary-400 dark:hover:border-primary-600 transition-colors
                   flex items-start gap-3"
          >
            <div
              class="w-10 h-10 rounded-xl shrink-0 grid place-items-center bg-primary-100 dark:bg-primary-900/40
                     text-primary-700 dark:text-primary-300 font-bold"
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
</div>
