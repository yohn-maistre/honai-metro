<script lang="ts">
  /**
   * Capability card (spec etnos/04), extracted verbatim from /agen so
   * /org/[slug] Level-0 pages can reuse it, behavior-identical to the
   * inline card it replaces.
   */
  import { Badge } from 'mono-svelte'

  interface Capability {
    id: string
    name: string
    kind: string
    actorType: string
    tier?: string
    status: string
    jurisdiction: string
    personas?: string[]
    services: string[]
    languages: string[]
    hours: string
  }

  interface Props {
    agent: Capability
    /** computed buka-sekarang from stated hours; null/undefined renders nothing */
    open?: boolean | null
  }

  let { agent, open = null }: Props = $props()

  const statusMeta: Record<string, { dot: string; label: string }> = {
    aktif: { dot: 'bg-green-500', label: 'Aktif' },
    terganggu: { dot: 'bg-amber-500', label: 'Terganggu' },
    luring: { dot: 'bg-zinc-400', label: 'Luring' },
    'kontak-wa': { dot: 'bg-blue-400', label: 'Kontak via WA' },
  }
</script>

<div
  class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xs border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 flex flex-col gap-3"
>
  <div class="flex items-start gap-3">
    <div
      class="w-10 h-10 rounded-xl shrink-0 grid place-items-center font-bold text-sm
      {agent.kind === 'agent'
        ? 'bg-slate-100 dark:bg-zinc-800 text-primary-600 dark:text-primary-400'
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'}"
    >
      {agent.name.charAt(0)}
    </div>
    <div class="flex flex-col gap-0.5 min-w-0">
      <h4 class="font-semibold dark:text-white">{agent.name}</h4>
      <div class="flex items-center gap-2 flex-wrap">
        {#if agent.kind === 'agent'}
          <Badge color="blue-subtle">{agent.actorType}</Badge>
          {#if agent.tier}
            <Badge color="green-subtle">{agent.tier}</Badge>
          {/if}
        {:else}
          <Badge color="gray-subtle">{agent.actorType}</Badge>
        {/if}
        <span
          class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400"
        >
          <span
            class="w-2 h-2 rounded-full {statusMeta[agent.status]?.dot ??
              'bg-zinc-400'}"
          ></span>
          {statusMeta[agent.status]?.label ?? agent.status}
        </span>
        {#if open !== null}
          <span
            class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400"
            title="Dihitung dari jam yang tercantum"
          >
            <span
              class="w-2 h-2 rounded-full {open
                ? 'bg-green-500'
                : 'bg-zinc-400'}"
            ></span>
            {open ? 'buka sekarang' : 'tutup sekarang'}
          </span>
        {/if}
      </div>
    </div>
  </div>
  <ul class="text-sm text-slate-700 dark:text-zinc-300 list-disc list-inside">
    {#each agent.services as s (s)}
      <li>{s}</li>
    {/each}
  </ul>
  <p class="text-xs text-slate-500 dark:text-zinc-400">
    {agent.jurisdiction} · {agent.languages.join(', ')} · {agent.hours}
    {#if agent.personas?.length}
      · {agent.personas.join(', ')}
    {/if}
  </p>
</div>
