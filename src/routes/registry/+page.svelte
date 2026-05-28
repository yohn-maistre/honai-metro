<script lang="ts">
  import { t } from '$lib/app/i18n'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge } from 'mono-svelte'
  import {
    ArrowTopRightOnSquare,
    CommandLine,
    Icon,
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

  // group by category
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
  <title>{$t('etnos.registry.title')} — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <EndPlaceholder size="lg">{$t('etnos.registry.title')}</EndPlaceholder>
  <p class="text-sm text-slate-500 dark:text-zinc-400">
    {$t('etnos.registry.subtitle')} — setiap alat divalidasi berdasarkan tiga
    kebijakan:
    <strong>KYC</strong> pengembang, lulus <strong>malware-scan</strong>, dan
    memenuhi ambang <strong>TKDN</strong>.
  </p>

  {#each Object.entries(byCategory) as [cat, tools] (cat)}
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold dark:text-white">{cat}</h2>
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
                <h3 class="font-semibold dark:text-white">
                  <code class="font-mono">{tool.name}</code>
                  <span
                    class="text-xs font-normal text-slate-400 dark:text-zinc-500"
                  >
                    v{tool.version}
                  </span>
                </h3>
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
</div>
