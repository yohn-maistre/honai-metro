<script lang="ts">
  import { t } from '$lib/app/i18n'
  import BarChart from '$lib/etnos/charts/BarChart.svelte'
  import LineChart from '$lib/etnos/charts/LineChart.svelte'
  import StatCard from '$lib/etnos/charts/StatCard.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import {
    AcademicCap,
    Banknotes,
    BuildingOffice2,
    ChartBar,
    ChatBubbleLeftRight,
    GlobeAmericas,
    Icon,
    type IconSource,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  import { getCached, loadLive, type LiveStats } from '$lib/etnos/live'

  let { data } = $props()

  // ETNOS: Papan Data Tanah Papua.
  // Live row from the PieFed backend (only what the API really answers —
  // see live.ts); section data from BPS / Satudata (demo JSON for now).
  // OTSUS tracker — UU 2/2021 transparency.

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
  <title>Papan Data Tanah Papua — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <EndPlaceholder size="lg">Papan Data Tanah Papua</EndPlaceholder>

  <!-- Live row: only what the backend really answers; anything the API
       can't confirm falls back to its demo tile, honestly labeled. -->
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
        color="text-blue-500"
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
        color="text-green-500"
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
        color="text-amber-500"
        demo
      />
    {/if}
    <StatCard
      label="Data Bahasa"
      value={data.topStats.language_data}
      icon={ChartBar}
      color="text-purple-500"
      demo
    />
  </div>

  <!-- Provincial data sections -->
  <EndPlaceholder size="sm">Data Provinsi</EndPlaceholder>

  {#snippet section(s: Section, icon: IconSource, color: string)}
    <div
      class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-4"
    >
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 shrink-0">
          <Icon src={icon} size="24" class={color} />
        </div>
        <div class="flex flex-col gap-0.5 min-w-0">
          <h3 class="font-semibold dark:text-white">{s.title}</h3>
          <p class="text-sm text-slate-500 dark:text-zinc-400">{s.subtitle}</p>
        </div>
      </div>

      {#if s.stats?.length}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each s.stats as st (st.label)}
            <StatCard
              label={st.label}
              value={st.value}
              unit={st.unit}
              demo={s.demo}
            />
          {/each}
        </div>
      {/if}

      {#if s.bars}
        <BarChart
          title={s.bars.title}
          data={s.bars.data}
          unit={s.bars.unit}
        />
      {/if}

      {#if s.line}
        <LineChart
          title={s.line.title}
          data={s.line.data}
          unit={s.line.unit}
        />
      {/if}

      <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
        {$t('etnos.dashboard.data_source')}: {s.source}
      </p>
    </div>
  {/snippet}

  <div class="grid grid-cols-1 gap-3">
    {@render section(data.sections.pendidikan, AcademicCap, 'text-blue-500')}
    {@render section(data.sections.ekonomi, Banknotes, 'text-green-500')}
    {@render section(
      data.sections.infrastruktur,
      BuildingOffice2,
      'text-orange-500',
    )}
    {@render section(data.sections.kualitasHidup, UserGroup, 'text-pink-500')}
  </div>

  <!-- OTSUS tracker -->
  <EndPlaceholder size="sm">{$t('etnos.dashboard.otsus')}</EndPlaceholder>
  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-4"
  >
    <div class="flex flex-col gap-0.5">
      <h3 class="font-semibold dark:text-white">{data.otsus.title}</h3>
      <p class="text-sm text-slate-500 dark:text-zinc-400">
        {data.otsus.subtitle}
      </p>
      <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
        Dasar: {data.otsus.regulation}
      </p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {#each data.otsus.stats as st (st.label)}
        <StatCard
          label={st.label}
          value={st.value}
          unit={st.unit}
          demo={data.otsus.demo}
        />
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
  </div>

  <!-- AI Agents section (Phase 4 placeholder; Batch C wires the AI feed tab) -->
  <EndPlaceholder size="sm">AI Agents</EndPlaceholder>
  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <p class="text-slate-500 dark:text-zinc-400 text-sm">
      Status agen AI Jayapura akan ditampilkan di sini. Agen-agen ini memantau
      sumber informasi lokal dan memberikan ringkasan pembaruan untuk komunitas.
    </p>
  </div>

  <!-- Sumber: every number on this board and where it comes from -->
  <EndPlaceholder size="sm">Sumber</EndPlaceholder>
  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-3"
  >
    <span class="eyebrow">Satu angka, satu sumber</span>
    <div class="ledger">
      <div>
        <span>Pengguna · Komunitas · Postingan 24 jam</span>
        <span class="v">piefed.social API — langsung</span>
      </div>
      <div>
        <span>Seksi pendidikan, ekonomi, infrastruktur, kualitas hidup</span>
        <span class="v">BPS / Satudata — data demo</span>
      </div>
      <div>
        <span>Pelacak OTSUS</span>
        <span class="v">UU 2/2021 — data demo</span>
      </div>
      <div>
        <span>Data bahasa</span>
        <span class="v">kurasi ETNOS — data demo</span>
      </div>
    </div>
    <p class="text-xs text-slate-400 dark:text-zinc-500">
      Angka berlabel <span class="font-mono uppercase">langsung</span> diambil
      dari server saat halaman dibuka; label
      <span class="font-mono uppercase">demo</span> berarti contoh yang menunggu
      sumber resmi.
    </p>
  </div>
</div>
