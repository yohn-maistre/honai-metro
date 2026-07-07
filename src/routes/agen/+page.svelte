<script lang="ts">
  import { t } from '$lib/app/i18n'
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge } from 'mono-svelte'
  import {
    ArrowTopRightOnSquare,
    BookOpen,
    CommandLine,
    CpuChip,
    DocumentText,
    Icon,
    Sparkles,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  const badgeMeta: Record<
    string,
    {
      label: string
      color: 'green-subtle' | 'blue-subtle' | 'yellow-subtle' | 'gray-subtle'
    }
  > = {
    kyc: { label: 'KYC', color: 'blue-subtle' },
    malware_scan: { label: 'Malware-scan', color: 'green-subtle' },
    tkdn: { label: 'TKDN', color: 'yellow-subtle' },
  }

  const byCategory = $derived(
    data.registry.tools.reduce(
      (acc, t) => {
        ;(acc[t.category] ??= []).push(t)
        return acc
      },
      {} as Record<string, (typeof data.registry.tools)[number][]>,
    ),
  )

</script>

<svelte:head>
  <title>{$t('etnos.agen.title')} — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-8 max-w-full w-full">
  <header class="flex flex-col gap-2">
    <EndPlaceholder size="lg">{$t('etnos.agen.title')}</EndPlaceholder>
    <p class="text-sm text-slate-500 dark:text-zinc-400">
      {$t('etnos.agen.subtitle')}
    </p>
  </header>

  <!-- Aksara flagship: foreshadowing -->
  <section
    class="rounded-3xl p-6 sm:p-8 border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/70 via-white to-white dark:from-amber-950/30 dark:via-zinc-950/40 dark:to-zinc-950/40 flex flex-col gap-4"
  >
    <div class="flex items-center gap-3 flex-wrap">
      <div
        class="w-12 h-12 rounded-2xl grid place-items-center bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
      >
        <Icon src={Sparkles} size="22" />
      </div>
      <h2 class="text-xl font-semibold dark:text-white">
        {$t('etnos.agen.aksara_flagship')}
      </h2>
      <Badge color="yellow-subtle" rounding="md">
        {$t('etnos.agen.aksara_coming')}
      </Badge>
    </div>
    <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose">
      {$t('etnos.agen.aksara_blurb')}
    </p>

    <!-- Directory: simulated capability cards (spec etnos/04) -->
    <div class="flex flex-col gap-3 mt-2">
      <div class="flex items-center gap-2 flex-wrap">
        <Icon src={UserGroup} size="18" class="text-slate-500 dark:text-zinc-400" />
        <h3 class="font-semibold dark:text-white">
          {$t('etnos.agen.directory')}
        </h3>
        <Badge color="yellow-subtle" rounding="md">
          {$t('etnos.agen.directory_demo')}
        </Badge>
      </div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-prose">
        {data.agents.note}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each data.agents.agents as agent (agent.id)}
          <CapabilityCard {agent} />
        {/each}
      </div>

      <!-- Activity placeholder (honest: appears when nodes are real) -->
      <div
        class="bg-white/80 dark:bg-zinc-900/80 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <Icon src={CpuChip} size="18" class="text-slate-500 dark:text-zinc-400" />
          <h3 class="font-semibold dark:text-white">
            {$t('etnos.agen.activity')}
          </h3>
        </div>
        <p class="text-sm text-slate-500 dark:text-zinc-400">
          {$t('etnos.agen.activity_empty')}
        </p>
      </div>
    </div>
  </section>

  <!-- Open MCP registry -->
  <section id="registry" class="flex flex-col gap-4">
    <div class="flex items-center gap-2 flex-wrap">
      <Icon src={CommandLine} size="20" class="text-primary-600 dark:text-primary-400" />
      <h2 class="text-xl font-semibold dark:text-white">
        {$t('etnos.agen.open_registry')}
      </h2>
    </div>
    <p class="text-sm text-slate-500 dark:text-zinc-400">
      {$t('etnos.agen.open_registry_subtitle')}
    </p>

    {#each Object.entries(byCategory) as [cat, tools] (cat)}
      <section class="flex flex-col gap-3">
        <h3 class="text-base font-semibold dark:text-white">{cat}</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {#each tools as tool (tool.name)}
            <div
              class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-3"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl shrink-0 grid place-items-center bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                >
                  <Icon src={CommandLine} size="20" />
                </div>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <h4 class="font-semibold dark:text-white">
                    <code class="font-mono">{tool.name}</code>
                    <span
                      class="text-xs font-normal text-slate-400 dark:text-zinc-500"
                    >
                      v{tool.version}
                    </span>
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400">
                    {tool.developer} · {tool.license}
                  </p>
                </div>
              </div>
              <p class="text-sm text-slate-700 dark:text-zinc-300">
                {tool.description}
              </p>
              <div class="flex flex-wrap gap-1.5 items-center">
                {#each tool.badges as b (b)}
                  {#if badgeMeta[b]}
                    <Badge color={badgeMeta[b].color} rounding="md">
                      {badgeMeta[b].label}
                    </Badge>
                  {/if}
                {/each}
                <a
                  href={tool.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-auto text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  repo
                  <Icon src={ArrowTopRightOnSquare} micro size="12" />
                </a>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </section>

  <!-- Standards & docs -->
  <section class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <Icon src={BookOpen} size="18" class="text-slate-500 dark:text-zinc-400" />
      <h2 class="text-lg font-semibold dark:text-white">
        {$t('etnos.agen.standards')}
      </h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <a
        href="/tentang#agen-register"
        class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-start gap-3"
      >
        <Icon src={DocumentText} size="18" class="text-slate-500 dark:text-zinc-400 mt-0.5" />
        <span class="font-medium dark:text-white">
          {$t('etnos.agen.standard_register')}
        </span>
      </a>
      <a
        href="/tentang#aksara-onboarding"
        class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-start gap-3"
      >
        <Icon src={DocumentText} size="18" class="text-slate-500 dark:text-zinc-400 mt-0.5" />
        <span class="font-medium dark:text-white">
          {$t('etnos.agen.standard_aksara')}
        </span>
      </a>
      <a
        href="/tentang#protocols"
        class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-start gap-3"
      >
        <Icon src={DocumentText} size="18" class="text-slate-500 dark:text-zinc-400 mt-0.5" />
        <span class="font-medium dark:text-white">
          {$t('etnos.agen.standard_protocols')}
        </span>
      </a>
      <a
        href="/tentang#consent"
        class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 transition-colors flex items-start gap-3"
      >
        <Icon src={DocumentText} size="18" class="text-slate-500 dark:text-zinc-400 mt-0.5" />
        <span class="font-medium dark:text-white">
          {$t('etnos.agen.standard_consent')}
        </span>
      </a>
    </div>
  </section>
</div>
