<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { DEFAULT_INSTANCE_URL } from '$lib/app/instance.svelte'
  import BarChart from '$lib/etnos/charts/BarChart.svelte'
  import LineChart from '$lib/etnos/charts/LineChart.svelte'
  import { DataChip, Figure, PageHeader, SectionHead } from '$lib/etnos/ui'
  import {
    Bolt,
    ChartBar,
    ChatBubbleLeftRight,
    GlobeAmericas,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  import { fetchGempa } from '$lib/etnos/layers'
  import { getCached, loadLive, type LiveStats } from '$lib/etnos/live'

  let { data } = $props()

  // Gempa 24 jam Papua: the same BMKG/USGS fetcher (and SWR cache) as the
  // front-page map, one fact one owner. null = feed unreachable, tile hidden.
  let gempa24 = $state<number | null>(null)
  $effect(() => {
    fetchGempa().then((r) => {
      if (r !== null) gempa24 = r.length
    })
  })

  const JUMP = [
    ['forum', 'Forum'],
    ['pendidikan', 'Pendidikan'],
    ['ekonomi', 'Ekonomi'],
    ['infrastruktur', 'Infrastruktur'],
    ['kualitas-hidup', 'Kualitas hidup'],
    ['otsus', 'OTSUS'],
    ['agen', 'Agen AI'],
    ['sumber', 'Sumber'],
  ] as const

  // ETNOS: Papan Data Tanah Papua, broadsheet edition: figures and charts
  // sit directly on the paper, sections are heading + rule, no boxes.
  // Live row from the PieFed backend (only what the API really answers,
  // see live.ts); section data from BPS / Satudata (contoh JSON for now).
  // OTSUS tracker per UU 2/2021 transparency.

  let live = $state<LiveStats | null>(getCached())
  $effect(() => {
    loadLive().then((s) => {
      if (s) live = s
    })
  })

  let liveUsers = $derived(live?.users ?? null)
  let liveCommunities = $derived(
    live?.communities != null
      ? live.communitiesSaturated
        ? `${live.communities}+`
        : live.communities
      : null,
  )
  let livePosts24h = $derived(
    live?.posts24h != null
      ? live.posts24hSaturated
        ? `${live.posts24h}+`
        : live.posts24h
      : null,
  )

  interface StatItem {
    label: string
    value: string
    unit: string
  }
  interface BarsBlock {
    title: string
    unit: string
    data: { label: string; value: number }[]
  }
  interface LineBlock {
    title: string
    unit: string
    data: { x: string | number; y: number }[]
  }
  interface Section {
    title: string
    subtitle: string
    source: string
    updated?: string
    demo?: boolean
    stats?: StatItem[]
    bars?: BarsBlock
    line?: LineBlock
  }
</script>

<svelte:head>
  <title>Papan Data Tanah Papua · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-8 max-w-full w-full">
  <PageHeader
    title="Papan Data Tanah Papua"
    lede="Angka hidup dari forum ini dan data publik provinsi. Satu angka, satu sumber."
  />

  <!-- jump-nav: plain anchors, sticky so long boards stay navigable -->
  <nav
    class="sticky top-0 z-10 -mx-1 px-1 py-2 -my-3 bg-slate-25 dark:bg-zinc-925 flex gap-1.5 overflow-x-auto scrollbar-none"
    aria-label="Bagian papan data"
  >
    {#each JUMP as [id, label] (id)}
      <a
        href="#{id}"
        class="shrink-0 rounded-full px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 no-underline transition-colors"
      >
        {label}
      </a>
    {/each}
  </nav>

  <!-- Live row: flat figures in a ruled ledger band. Only what the
       backend really answers; anything the API can't confirm falls back
       to its contoh figure, honestly labeled. -->
  <div
    id="forum"
    class="scroll-mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4 border-y border-slate-200/70 dark:border-zinc-800 py-4"
  >
    {#if liveUsers != null}
      <Figure
        label="Pengguna Terdaftar"
        value={liveUsers}
        icon={UserGroup}
        live
      />
    {:else}
      <Figure
        label="Pengguna Aktif"
        value={data.topStats.active_users}
        icon={UserGroup}
        demo
      />
    {/if}
    {#if livePosts24h != null}
      <Figure
        label="Postingan 24 Jam"
        value={livePosts24h}
        icon={ChatBubbleLeftRight}
        live
      />
    {:else}
      <Figure
        label="Postingan Hari Ini"
        value={data.topStats.posts_today}
        icon={ChatBubbleLeftRight}
        demo
      />
    {/if}
    {#if liveCommunities != null}
      <Figure
        label="Komunitas Lokal"
        value={liveCommunities}
        icon={GlobeAmericas}
        live
      />
    {:else}
      <Figure
        label="Komunitas"
        value={data.topStats.communities}
        icon={GlobeAmericas}
        demo
      />
    {/if}
    <Figure
      label="Data Bahasa"
      value={data.topStats.language_data}
      icon={ChartBar}
      demo
    />
    {#if gempa24 != null}
      <a href="/" class="no-underline" title="Lihat di Peta Kabar">
        <Figure label="Gempa 24 Jam Papua" value={gempa24} icon={Bolt} live />
      </a>
    {/if}
  </div>

  {#snippet section(s: Section, id: string)}
    <section {id} class="scroll-mt-16 flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <SectionHead title={s.title}>
          {#snippet action()}
            {#if s.demo}
              <DataChip state="contoh" />
            {/if}
          {/snippet}
        </SectionHead>
        <p class="text-sm text-slate-500 dark:text-zinc-400">{s.subtitle}</p>
      </div>

      {#if s.stats?.length}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          {#each s.stats as st (st.label)}
            <Figure label={st.label} value={st.value} unit={st.unit} />
          {/each}
        </div>
      {/if}

      {#if s.bars}
        <BarChart title={s.bars.title} data={s.bars.data} unit={s.bars.unit} />
      {/if}

      {#if s.line}
        <LineChart title={s.line.title} data={s.line.data} unit={s.line.unit} />
      {/if}

      <p class="text-xs text-slate-400 dark:text-zinc-500">
        {$t('etnos.dashboard.data_source')}: {s.source}
      </p>
    </section>
  {/snippet}

  {@render section(data.sections.pendidikan, 'pendidikan')}
  {@render section(data.sections.ekonomi, 'ekonomi')}
  {@render section(data.sections.infrastruktur, 'infrastruktur')}
  {@render section(data.sections.kualitasHidup, 'kualitas-hidup')}

  <!-- OTSUS tracker -->
  <section id="otsus" class="scroll-mt-16 flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <SectionHead title={data.otsus.title}>
        {#snippet action()}
          {#if data.otsus.demo}
            <DataChip state="contoh" />
          {/if}
        {/snippet}
      </SectionHead>
      <p class="text-sm text-slate-500 dark:text-zinc-400">
        {data.otsus.subtitle}
      </p>
      <p class="text-xs text-slate-400 dark:text-zinc-500">
        Dasar: {data.otsus.regulation}
      </p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
      {#each data.otsus.stats as st (st.label)}
        <Figure label={st.label} value={st.value} unit={st.unit} />
      {/each}
    </div>

    <BarChart
      title={data.otsus.bars.title}
      data={data.otsus.bars.data}
      unit={data.otsus.bars.unit}
    />

    <LineChart
      title={data.otsus.line.title}
      data={data.otsus.line.data}
      unit={data.otsus.line.unit}
    />

    <p class="text-xs text-slate-400 dark:text-zinc-500">
      {$t('etnos.dashboard.data_source')}: {data.otsus.source}
    </p>
  </section>

  <!-- Agen AI (placeholder until real nodes report in) -->
  <section id="agen" class="scroll-mt-16 flex flex-col gap-2">
    <SectionHead title="Status agen AI">
      {#snippet action()}
        <DataChip state="segera" />
      {/snippet}
    </SectionHead>
    <p class="text-slate-500 dark:text-zinc-400 text-sm max-w-prose">
      Status agen AI akan tampil di sini: pemantauan sumber informasi lokal dan
      ringkasan pembaruan untuk komunitas.
    </p>
  </section>

  <!-- Sumber: every number on this board and where it comes from -->
  <section id="sumber" class="scroll-mt-16 flex flex-col gap-2">
    <SectionHead title="Satu angka, satu sumber" />
    <dl
      class="flex flex-col divide-y divide-slate-200/70 dark:divide-zinc-800 text-sm"
    >
      <div class="flex justify-between items-center gap-4 py-2">
        <dt class="text-slate-600 dark:text-zinc-400">
          Pengguna, komunitas, postingan 24 jam
        </dt>
        <dd
          class="text-right font-medium dark:text-zinc-200 flex items-center gap-2"
        >
          {DEFAULT_INSTANCE_URL}
          <DataChip state="langsung" />
        </dd>
      </div>
      {#if gempa24 != null}
        <div class="flex justify-between items-center gap-4 py-2">
          <dt class="text-slate-600 dark:text-zinc-400">Gempa 24 jam Papua</dt>
          <dd
            class="text-right font-medium dark:text-zinc-200 flex items-center gap-2"
          >
            BMKG + USGS
            <DataChip state="langsung" />
          </dd>
        </div>
      {/if}
      <div class="flex justify-between items-center gap-4 py-2">
        <dt class="text-slate-600 dark:text-zinc-400">
          Pendidikan, ekonomi, infrastruktur, kualitas hidup
        </dt>
        <dd
          class="text-right font-medium dark:text-zinc-200 flex items-center gap-2"
        >
          BPS / Satudata
          <DataChip state="contoh" />
        </dd>
      </div>
      <div class="flex justify-between items-center gap-4 py-2">
        <dt class="text-slate-600 dark:text-zinc-400">Pelacak OTSUS</dt>
        <dd
          class="text-right font-medium dark:text-zinc-200 flex items-center gap-2"
        >
          UU 2/2021
          <DataChip state="contoh" />
        </dd>
      </div>
      <div class="flex justify-between items-center gap-4 py-2">
        <dt class="text-slate-600 dark:text-zinc-400">Data bahasa</dt>
        <dd
          class="text-right font-medium dark:text-zinc-200 flex items-center gap-2"
        >
          kurasi ETNOS
          <DataChip state="contoh" />
        </dd>
      </div>
    </dl>
    <p class="text-xs text-slate-400 dark:text-zinc-500">
      Angka berlabel <span class="font-medium">langsung</span>
      diambil dari server saat halaman dibuka. Label
      <span class="font-medium">data contoh</span>
       berarti contoh yang menunggu sumber resmi.
    </p>
  </section>
</div>
