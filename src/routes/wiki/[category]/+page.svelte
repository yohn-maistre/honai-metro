<script lang="ts">
  import { t } from '$lib/app/i18n'
  import Markdown from '$lib/app/markdown/Markdown.svelte'
  import BahasaHub from '$lib/etnos/BahasaHub.svelte'
  import LocatorPlate from '$lib/etnos/LocatorPlate.svelte'
  import { isTtsAvailable, speak, stop } from '$lib/etnos/tts'
  import { categories, meta } from '$lib/etnos/wiki'
  import wajahData from '$lib/etnos/wiki/wajah.json'
  import { BackLink, SectionHead } from '$lib/etnos/ui'
  import { Button } from 'mono-svelte'
  import { onDestroy } from 'svelte'
  import {
    ArrowLeft,
    ArrowRight,
    Icon,
    SpeakerWave,
    Stop,
  } from 'svelte-hero-icons/dist'

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

  // Broadsheet split: the intro before the first `##` becomes the
  // standfirst (first paragraph, set large) plus the rest; every `##`
  // chunk is a numbered section rendered with a page-authored h2.
  const parsed = $derived.by(() => {
    const src = body.replace(/\r\n/g, '\n')
    const chunks = src.split(/^(?=##\s)/m)
    const intro = chunks[0]?.startsWith('## ') ? '' : (chunks.shift() ?? '')
    const sections = chunks.map((c) => {
      const nl = c.indexOf('\n')
      return {
        heading: (nl === -1 ? c : c.slice(0, nl)).replace(/^##\s+/, '').trim(),
        body: nl === -1 ? '' : c.slice(nl + 1).trim(),
      }
    })
    const paras = intro.trim().split(/\n\s*\n/)
    return {
      standfirst: paras[0] ?? '',
      introRest: paras.slice(1).join('\n\n'),
      sections,
    }
  })
  const toc = $derived(parsed.sections.map((s) => s.heading))

  // Wajah figures: verified registry entries of this category with an
  // attributable image ride the first section that names them; the rest
  // close the article as a "Wajah terkait" strip.
  interface WajahEntry {
    id: string
    nama: string
    gambar: { url: string; lisensi: string; atribusi: string } | null
    koordinat: number[] | null
    kategori: string
  }
  type WajahFig = WajahEntry & { gambar: NonNullable<WajahEntry['gambar']> }

  const eligible = $derived(
    (wajahData.entries as WajahEntry[]).filter(
      (e): e is WajahFig => e.kategori === data.slug && !!e.gambar,
    ),
  )

  function candidates(nama: string): string[] {
    const out = [nama]
    const stripped = nama.replace(/^(?:Suku|Kepulauan)\s+/, '')
    if (stripped !== nama) out.push(stripped)
    const first = nama.split(/\s+/)[0] ?? ''
    if (first.length >= 6 && first !== nama) out.push(first)
    return out
  }

  const placement = $derived.by(() => {
    const bySection = new Map<number, WajahFig[]>()
    const unmatched: WajahFig[] = []
    const secs = parsed.sections
    for (const e of eligible) {
      let hit = -1
      outer: for (const cand of candidates(e.nama)) {
        const escaped = cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'iu')
        for (let i = 0; i < secs.length; i++) {
          if (re.test(secs[i]!.heading) || re.test(secs[i]!.body)) {
            hit = i
            break outer
          }
        }
      }
      if (hit === -1) unmatched.push(e)
      else bySection.set(hit, [...(bySection.get(hit) ?? []), e])
    }
    return { bySection, unmatched }
  })

  let broken = $state<Record<string, boolean>>({})

  function goToSection(i: number) {
    articleEl
      ?.querySelectorAll('h2')
      [i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // The page-authored section h2s are the only h2s inside articleEl (end
  // matter lives outside it); rewire whenever the article changes.
  $effect(() => {
    void parsed
    if (!articleEl) return
    activeSection = 0
    const headings = [...articleEl.querySelectorAll('h2')]
    if (!headings.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            activeSection = headings.indexOf(e.target as HTMLHeadingElement)
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    headings.forEach((h) => io.observe(h))
    return () => io.disconnect()
  })

  // Prev/next through the alphabetized category slugs, no wrap-around.
  const prevSlug = $derived.by(() => {
    const i = categories.indexOf(data.slug)
    return i > 0 ? categories[i - 1]! : null
  })
  const nextSlug = $derived.by(() => {
    const i = categories.indexOf(data.slug)
    return i !== -1 && i < categories.length - 1 ? categories[i + 1]! : null
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

{#snippet wajahFigure(e: WajahFig, compact: boolean)}
  <div class="flex flex-col gap-1.5 min-w-0">
    {#if !broken[e.id]}
      <figure class="flex flex-col gap-1">
        <img
          src={e.gambar.url}
          alt={e.nama}
          loading="lazy"
          onerror={() => (broken[e.id] = true)}
          class={[
            'w-full object-cover',
            compact ? 'aspect-[3/2]' : 'aspect-[4/3]',
          ]}
        />
        <figcaption class="text-xs text-slate-500 dark:text-zinc-400">
          {e.nama} · {e.gambar.atribusi} ({e.gambar.lisensi})
        </figcaption>
      </figure>
    {/if}
    {#if data.slug === 'tempat' && e.koordinat}
      <LocatorPlate koordinat={e.koordinat} class="h-20 mt-1" />
      <p class="text-xs text-slate-500 dark:text-zinc-400">
        {$t('etnos.wiki.wajah_plate')}
      </p>
    {/if}
  </div>
{/snippet}

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
      class="lg:hidden border-y border-slate-200 dark:border-zinc-800 py-3"
    >
      <summary
        class="text-sm font-semibold text-slate-900 dark:text-zinc-100 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
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
            aria-current={activeSection === i ? 'true' : undefined}
            class={[
              'relative text-sm text-left py-1.5 transition-colors',
              activeSection === i
                ? 'pl-4 text-slate-900 dark:text-zinc-100 font-medium'
                : 'pl-3 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200',
            ]}
            onclick={() => goToSection(i)}
          >
            {#if activeSection === i}
              <span
                class="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-primary-500"
                aria-hidden="true"
              ></span>
            {/if}
            {section}
          </button>
        {/each}
      </nav>
    {/if}

    <div class="min-w-0 flex flex-col gap-8">
      <div
        bind:this={articleEl}
        class="flex flex-col gap-8 [&_h2]:scroll-mt-20"
      >
        {#if parsed.standfirst}
          <div
            class="flex flex-col gap-3 border-b border-slate-200 dark:border-zinc-800 pb-5"
          >
            <div
              class="[&_p]:text-lg sm:[&_p]:text-xl [&_p]:leading-relaxed [&_p]:text-slate-800 dark:[&_p]:text-zinc-200"
            >
              <Markdown source={parsed.standfirst} />
            </div>
            {#if parsed.introRest}
              <Markdown source={parsed.introRest} />
            {/if}
          </div>
        {/if}

        {#each parsed.sections as sec, i (i)}
          {@const figs = placement.bySection.get(i) ?? []}
          <section
            class={[
              'flex flex-col gap-4',
              figs.length === 1 &&
                'lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-8',
            ]}
          >
            <div
              class={[
                'flex items-baseline gap-3 border-b border-slate-200 dark:border-zinc-800 pb-2',
                figs.length === 1 && 'lg:col-span-2',
              ]}
            >
              <span
                class="text-sm font-semibold tabular-nums text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2
                class="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50"
              >
                {sec.heading}
              </h2>
            </div>
            <div class="min-w-0">
              <Markdown source={sec.body} />
            </div>
            {#if figs.length === 1}
              <aside class="min-w-0">
                {@render wajahFigure(figs[0]!, false)}
              </aside>
            {:else if figs.length > 1}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {#each figs as e (e.id)}
                  {@render wajahFigure(e, true)}
                {/each}
              </div>
            {/if}
          </section>
        {/each}
      </div>

      {#if placement.unmatched.length}
        <div class="flex flex-col gap-3">
          <SectionHead title={$t('etnos.wiki.wajah_terkait')} />
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {#each placement.unmatched as e (e.id)}
              {@render wajahFigure(e, true)}
            {/each}
          </div>
        </div>
      {/if}

      {#if data.bahasa}
        <BahasaHub languages={data.bahasa} />
      {/if}

      <nav
        class="flex items-start justify-between gap-4 border-t border-slate-200 dark:border-zinc-800 pt-4"
      >
        {#if prevSlug}
          <a
            href="/wiki/{prevSlug}"
            class="group flex flex-col gap-0.5 min-w-0"
          >
            <span class="text-xs text-slate-500 dark:text-zinc-400">
              {$t('etnos.wiki.prev')}
            </span>
            <span
              class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-zinc-200 group-hover:text-primary-600 dark:group-hover:text-primary-400"
            >
              <Icon src={ArrowLeft} micro size="14" />
              {$t(`etnos.wiki.categories.${prevSlug.replace(/-/g, '_')}`)}
            </span>
          </a>
        {:else}
          <span></span>
        {/if}
        {#if nextSlug}
          <a
            href="/wiki/{nextSlug}"
            class="group flex flex-col gap-0.5 min-w-0 items-end text-right"
          >
            <span class="text-xs text-slate-500 dark:text-zinc-400">
              {$t('etnos.wiki.next')}
            </span>
            <span
              class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-zinc-200 group-hover:text-primary-600 dark:group-hover:text-primary-400"
            >
              {$t(`etnos.wiki.categories.${nextSlug.replace(/-/g, '_')}`)}
              <Icon src={ArrowRight} micro size="14" />
            </span>
          </a>
        {:else}
          <span></span>
        {/if}
      </nav>
    </div>
  </div>
</div>
