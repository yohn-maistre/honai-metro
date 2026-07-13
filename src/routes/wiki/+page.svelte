<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { meta } from '$lib/etnos/wiki'
  import KataHariIni from '$lib/etnos/KataHariIni.svelte'
  import { fetchCuaca, type CuacaPoint } from '$lib/etnos/layers'
  import SejarahHariIni from '$lib/etnos/SejarahHariIni.svelte'
  import WajahTanah from '$lib/etnos/WajahTanah.svelte'
  import { DataChip, Figure, IconTile, PageHeader, SectionHead } from '$lib/etnos/ui'
  import {
    ArrowRight,
    ChatBubbleLeftRight,
    Clock,
    Fire,
    GlobeAsiaAustralia,
    Icon,
    MapPin,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  // ETNOS wiki index: the reference desk. The Almanak dateline strip, the
  // daily hero (Wajah + Sejarah + Kata, with TTS), a category grid with
  // honest derived metadata, and the contribution note. Peta Kabar moved
  // home into Papan Sinyal (owner call 2026-07-13: buried in the wiki it
  // was not useful on phones). Articles live in src/lib/etnos/wiki/*.md.

  // Almanak: WIT wall-clock date + sunrise/sunset from the same Open-Meteo
  // cache the map and board read (one fact, one owner). Jayapura anchor.
  const now = new Date()
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jayapura',
  }).format(now)
  const hari = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    timeZone: 'Asia/Jayapura',
  }).format(now)

  let matahari = $state<CuacaPoint | null>(null)
  $effect(() => {
    fetchCuaca().then((r) => {
      matahari =
        r?.find((p) => p.kota === 'Jayapura' && p.terbit && p.terbenam) ??
        r?.find((p) => p.terbit && p.terbenam) ??
        null
    })
  })

  const categories = [
    { slug: 'tempat', icon: MapPin },
    { slug: 'sejarah', icon: Clock },
    { slug: 'biodiversitas', icon: GlobeAsiaAustralia },
    { slug: 'suku-bahasa', icon: UserGroup },
    { slug: 'bahasa', icon: ChatBubbleLeftRight },
    { slug: 'kuliner', icon: Fire },
  ]
</script>

<svelte:head>
  <title>Wiki Tanah Papua · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <PageHeader title="Wiki Tanah Papua" lede={$t('etnos.wiki.lede')} />

  <section class="flex flex-col gap-3">
    <SectionHead title={$t('etnos.wiki.almanak')}>
      {#snippet action()}
        {#if matahari}
          <DataChip state="langsung" />
        {/if}
      {/snippet}
    </SectionHead>
    <div class="grid grid-cols-3 gap-x-6">
      <Figure value={tanggal} label={hari} />
      {#if matahari}
        <Figure
          value={matahari.terbit!}
          unit="WIT"
          label={`${$t('etnos.wiki.terbit')} · ${matahari.kota}`}
        />
        <Figure
          value={matahari.terbenam!}
          unit="WIT"
          label={`${$t('etnos.wiki.terbenam')} · ${matahari.kota}`}
        />
      {/if}
    </div>
  </section>

  <WajahTanah />

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
    <SejarahHariIni history={data.todayHistory} />
    <KataHariIni word={data.todayWord} />
  </div>

  <section class="flex flex-col gap-2">
    <SectionHead title={$t('etnos.wiki.kategori_head')} />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
      {#each categories as cat (cat.slug)}
        {@const key = cat.slug.replace(/-/g, '_')}
        {@const m = meta[cat.slug]}
        <a
          href="/wiki/{cat.slug}"
          class="group flex items-start gap-3 no-underline py-3 border-b border-slate-200/60 dark:border-zinc-800"
        >
          <IconTile icon={cat.icon} size="md" />
          <div class="flex flex-col gap-0.5 min-w-0">
            <span
              class="text-base font-semibold dark:text-white transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
            >
              {$t(`etnos.wiki.categories.${key}`)}
            </span>
            <p class="text-sm text-slate-600 dark:text-zinc-400 leading-snug">
              {$t(`etnos.wiki.desc.${key}`)}
            </p>
            {#if m}
              <span
                class="text-xs text-slate-500 dark:text-zinc-500 tabular-nums"
              >
                {m.sections}
                {$t('etnos.wiki.sections')} · {m.minutes}
                {$t('etnos.wiki.minutes')}
              </span>
            {/if}
          </div>
          <Icon
            src={ArrowRight}
            micro
            size="16"
            class="ml-auto mt-1 shrink-0 text-slate-400 dark:text-zinc-500 transition-transform group-hover:translate-x-0.5"
          />
        </a>
      {/each}
    </div>
  </section>

  <section class="flex flex-col gap-2">
    <SectionHead title="Berkontribusi" />
    <p
      class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose"
    >
      Wiki ini dirawat manual dan diperkaya kontribusi komunitas lewat forum
      <a
        href="/c/wiki"
        class="font-medium text-primary-600 dark:text-primary-400 hover:underline">c/wiki</a
      >. Gunakan bahasa daerah Anda di forum, tambahkan cerita budaya dan
      sejarah, dan bantu memeriksa terjemahan serta isi artikel.
    </p>
  </section>
</div>
