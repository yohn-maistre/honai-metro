<script lang="ts">
  import { t } from '$lib/app/i18n'
  import BarChart from '$lib/etnos/charts/BarChart.svelte'
  import LineChart from '$lib/etnos/charts/LineChart.svelte'
  import StatCard from '$lib/etnos/charts/StatCard.svelte'
  import { DataChip, IconTile, PageHeader } from '$lib/etnos/ui'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Material } from 'mono-svelte'
  import {
    AcademicCap,
    Banknotes,
    BuildingOffice2,
    ChartBar,
    ChatBubbleLeftRight,
    CpuChip,
    GlobeAmericas,
    type IconSource,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  import { getCached, loadLive, type LiveStats } from '$lib/etnos/live'

  let { data } = $props()

  // ETNOS: Papan Data Tanah Papua.
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

<div class="flex flex-col gap-6 max-w-full w-full">
  <PageHeader
    title="Papan Data Tanah Papua"
    lede="Angka hidup dari forum ini dan data publik provinsi. Satu angka, satu sumber."
  />

  <!-- Live row: only what the backend really answers; anything the API
       can't confirm falls back to its contoh tile, honestly labeled. -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {#if liveUsers != null}
      <StatCard
        label="Pengguna Terdaftar"
        value={liveUsers}
        icon={UserGroup}
        color="text-primary-500"
        live
      />
    {:else}
      <StatCard
        label="Pengguna Aktif"
        value={data.topStats.active_users}
        icon={UserGroup}
        color="text-slate-400 dark:text-zinc-500"
        demo
      />
    {/if}
    {#if livePosts24h != null}
      <StatCard
        label="Postingan 24 Jam"
        value={livePosts24h}
        icon={ChatBubbleLeftRight}
        color="text-primary-500"
        live
      />
    {:else}
      <StatCard
        label="Postingan Hari Ini"
        value={data.topStats.posts_today}
        icon={ChatBubbleLeftRight}
        color="text-slate-400 dark:text-zinc-500"
        demo
      />
    {/if}
    {#if liveCommunities != null}
      <StatCard
        label="Komunitas Lokal"
        value={liveCommunities}
        icon={GlobeAmericas}
        color="text-primary-500"
        live
      />
    {:else}
      <StatCard
        label="Komunitas"
        value={data.topStats.communities}
        icon={GlobeAmericas}
        color="text-slate-400 dark:text-zinc-500"
        demo
      />
    {/if}
    <StatCard
      label="Data Bahasa"
      value={data.topStats.language_data}
      icon={ChartBar}
      color="text-slate-400 dark:text-zinc-500"
      demo
    />
  </div>

  <!-- Provincial data sections -->
  <EndPlaceholder size="sm">Data Provinsi</EndPlaceholder>

  {#snippet section(s: Section, icon: IconSource)}
    <Material
      color="default"
      rounding="2xl"
      padding="lg"
      class="flex flex-col gap-4"
    >
      <div class="flex items-start gap-3">
        <IconTile {icon} size="md" />
        <div class="flex flex-col gap-0.5 min-w-0">
          <h3 class="font-semibold dark:text-white">{s.title}</h3>
          <p class="text-sm text-slate-500 dark:text-zinc-400">{s.subtitle}</p>
        </div>
        {#if s.demo}
          <DataChip state="contoh" class="ml-auto mt-1" />
        {/if}
      </div>

      {#if s.stats?.length}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each s.stats as st (st.label)}
            <StatCard label={st.label} value={st.value} unit={st.unit} />
          {/each}
        </div>
      {/if}

      {#if s.bars}
        <BarChart title={s.bars.title} data={s.bars.data} unit={s.bars.unit} />
      {/if}

      {#if s.line}
        <LineChart title={s.line.title} data={s.line.data} unit={s.line.unit} />
      {/if}

      <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
        {$t('etnos.dashboard.data_source')}: {s.source}
      </p>
    </Material>
  {/snippet}

  <div class="grid grid-cols-1 gap-3">
    {@render section(data.sections.pendidikan, AcademicCap)}
    {@render section(data.sections.ekonomi, Banknotes)}
    {@render section(data.sections.infrastruktur, BuildingOffice2)}
    {@render section(data.sections.kualitasHidup, UserGroup)}
  </div>

  <!-- OTSUS tracker -->
  <EndPlaceholder size="sm">{$t('etnos.dashboard.otsus')}</EndPlaceholder>
  <Material
    color="default"
    rounding="2xl"
    padding="lg"
    class="flex flex-col gap-4"
  >
    <div class="flex items-start gap-3">
      <IconTile icon={Banknotes} size="md" />
      <div class="flex flex-col gap-0.5 min-w-0">
        <h3 class="font-semibold dark:text-white">{data.otsus.title}</h3>
        <p class="text-sm text-slate-500 dark:text-zinc-400">
          {data.otsus.subtitle}
        </p>
        <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Dasar: {data.otsus.regulation}
        </p>
      </div>
      {#if data.otsus.demo}
        <DataChip state="contoh" class="ml-auto mt-1" />
      {/if}
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {#each data.otsus.stats as st (st.label)}
        <StatCard label={st.label} value={st.value} unit={st.unit} />
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

    <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
      {$t('etnos.dashboard.data_source')}: {data.otsus.source}
    </p>
  </Material>

  <!-- Agen AI (placeholder until real nodes report in) -->
  <EndPlaceholder size="sm">Agen AI</EndPlaceholder>
  <Material
    color="default"
    rounding="2xl"
    padding="lg"
    class="flex items-start gap-3"
  >
    <IconTile icon={CpuChip} size="md" />
    <div class="flex flex-col gap-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="font-semibold dark:text-white">Status agen AI</h3>
        <DataChip state="segera" />
      </div>
      <p class="text-slate-500 dark:text-zinc-400 text-sm">
        Status agen AI akan tampil di sini: pemantauan sumber informasi lokal
        dan ringkasan pembaruan untuk komunitas.
      </p>
    </div>
  </Material>

  <!-- Sumber: every number on this board and where it comes from -->
  <EndPlaceholder size="sm">Sumber</EndPlaceholder>
  <Material
    color="default"
    rounding="2xl"
    padding="lg"
    class="flex flex-col gap-3"
  >
    <h3 class="font-semibold dark:text-white">Satu angka, satu sumber</h3>
    <dl
      class="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800 text-sm"
    >
      <div class="flex justify-between items-center gap-4 py-2">
        <dt class="text-slate-600 dark:text-zinc-400">
          Pengguna, komunitas, postingan 24 jam
        </dt>
        <dd
          class="text-right font-medium dark:text-zinc-200 flex items-center gap-2"
        >
          piefed.social
          <DataChip state="langsung" />
        </dd>
      </div>
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
      Angka berlabel <span class="font-medium">langsung</span> diambil dari
      server saat halaman dibuka. Label
      <span class="font-medium">data contoh</span> berarti contoh yang menunggu
      sumber resmi.
    </p>
  </Material>
</div>
