<script lang="ts">
  /**
   * Compact spec-sheet card for the open MCP registry on /agen. The
   * instrument exception to the broadsheet rule: each tool is a
   * self-contained object, so it gets the card skin (rounded-xl, tighter
   * padding), never the chunky feature-card treatment.
   */
  import { Badge } from 'mono-svelte'
  import { ArrowTopRightOnSquare, Icon } from 'svelte-hero-icons/dist'

  interface Tool {
    name: string
    version: string
    developer: string
    license: string
    description: string
    badges: string[]
    repo: string
  }

  interface Props {
    tool: Tool
    badgeMeta: Record<
      string,
      {
        label: string
        color: 'green-subtle' | 'blue-subtle' | 'yellow-subtle' | 'gray-subtle'
      }
    >
  }

  let { tool, badgeMeta }: Props = $props()
</script>

<article
  class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 p-3.5 flex flex-col gap-2"
>
  <header class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
    <code class="font-mono text-sm font-semibold dark:text-white">
      {tool.name}
    </code>
    <span class="text-xs text-slate-400 dark:text-zinc-500">
      v{tool.version}
    </span>
    <span class="ml-auto text-right text-xs text-slate-500 dark:text-zinc-400">
      {tool.developer} · {tool.license}
    </span>
  </header>
  <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
    {tool.description}
  </p>
  <footer class="flex flex-wrap items-center gap-1.5 mt-auto pt-0.5">
    {#each tool.badges as b (b)}
      {#if badgeMeta[b]}
        <Badge color={badgeMeta[b].color}>
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
  </footer>
</article>
