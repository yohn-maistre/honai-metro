<script lang="ts">
  import { t } from '$lib/app/i18n'
  import Markdown from '$lib/app/markdown/Markdown.svelte'
  import BahasaHub from '$lib/etnos/BahasaHub.svelte'
  import { isTtsAvailable, speak, stop } from '$lib/etnos/tts'
  import { meta } from '$lib/etnos/wiki'
  import { BackLink } from '$lib/etnos/ui'
  import { Button, Material } from 'mono-svelte'
  import { onDestroy, onMount } from 'svelte'
  import { Icon, SpeakerWave, Stop } from 'svelte-hero-icons/dist'

  let { data } = $props()

  let speaking = $state(false)
  let articleEl = $state<HTMLElement>()
  let activeSection = $state(0)

  const labelKey = $derived(
    `etnos.wiki.categories.${data.slug.replace(/-/g, '_')}`,
  )
  const m = $derived(meta[data.slug])

  // The markdown's own `# Title` becomes the page header; the body renders
  // without it so the title exists exactly once.
  const titleMatch = $derived(data.content.match(/^#\s+(.+)$/m))
  const title = $derived(titleMatch?.[1] ?? t.get(labelKey))
  const body = $derived(
    titleMatch ? data.content.replace(titleMatch[0], '').trimStart() : data.content,
  )

  // Table of contents from ## headings; navigation scrolls to the nth h2 in
  // the rendered article (no renderer changes needed).
  const toc = $derived(
    [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]!),
  )

  function goToSection(i: number) {
    articleEl
      ?.querySelectorAll('h2')
      [i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  onMount(() => {
    if (!articleEl) return
    const headings = [...articleEl.querySelectorAll('h2')]
    if (!headings.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) activeSection = headings.indexOf(e.target as HTMLHeadingElement)
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    headings.forEach((h) => io.observe(h))
    return () => io.disconnect()
  })

  function toggleSpeak() {
    if (speaking) {
      stop()
      speaking = false
      return
    }
    // Strip markdown syntax (very rough) before reading.
    const plain = data.content
      .replace(/[#*_`>[\]()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    speak(plain, 'id-ID')
    speaking = true
    const poll = setInterval(() => {
      if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
        speaking = false
        clearInterval(poll)
      }
    }, 300)
  }

  onDestroy(() => stop())
</script>

<svelte:head>
  <title>{title} · Wiki Tanah Papua · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <div class="flex flex-wrap gap-2 items-center justify-between">
    <BackLink href="/wiki">Wiki Tanah Papua</BackLink>
    {#if isTtsAvailable()}
      <Button size="sm" color="tertiary" onclick={toggleSpeak}>
        {#snippet prefix()}
          <Icon src={speaking ? Stop : SpeakerWave} micro size="16" />
        {/snippet}
        {speaking
          ? $t('etnos.wiki.stop_reading')
          : $t('etnos.wiki.read_aloud')}
      </Button>
    {/if}
  </div>

  <header class="flex flex-col gap-1">
    <h1
      class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50"
    >
      {title}
    </h1>
    {#if m}
      <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
        {$t(labelKey)} · {m.sections}
        {$t('etnos.wiki.sections')} · {m.minutes}
        {$t('etnos.wiki.minutes')}
      </p>
    {/if}
  </header>

  {#if toc.length > 1}
    <details
      class="lg:hidden bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 px-4 py-3"
    >
      <summary
        class="text-sm font-semibold text-slate-900 dark:text-zinc-100 cursor-pointer select-none"
      >
        {$t('etnos.wiki.toc')}
      </summary>
      <ol class="mt-2 flex flex-col gap-1.5">
        {#each toc as section, i (i)}
          <li>
            <button
              type="button"
              class="text-sm text-left text-slate-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400"
              onclick={() => goToSection(i)}
            >
              {section}
            </button>
          </li>
        {/each}
      </ol>
    </details>
  {/if}

  <div
    class={[
      'w-full items-start gap-6',
      toc.length > 1 && 'lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]',
    ]}
  >
    {#if toc.length > 1}
      <nav
        class="hidden lg:flex flex-col gap-0.5 sticky top-20"
        aria-label={$t('etnos.wiki.toc')}
      >
        <span
          class="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1.5"
        >
          {$t('etnos.wiki.toc')}
        </span>
        {#each toc as section, i (i)}
          <button
            type="button"
            class={[
              'text-sm text-left rounded-lg px-2.5 py-1.5 transition-colors',
              activeSection === i
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200',
            ]}
            onclick={() => goToSection(i)}
          >
            {section}
          </button>
        {/each}
      </nav>
    {/if}

    <div bind:this={articleEl} class="min-w-0 [&_h2]:scroll-mt-20">
      <Material
        color="default"
        rounding="2xl"
        padding="xl"
        class="flex flex-col gap-2"
      >
        <Markdown source={body} />
      </Material>
    </div>
  </div>

  {#if data.bahasa}
    <BahasaHub languages={data.bahasa} />
  {/if}
</div>
