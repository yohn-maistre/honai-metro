<script lang="ts">
  import { t } from '$lib/app/i18n'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import {
    ChartBar,
    Icon,
    UserGroup,
    ChatBubbleLeftRight,
    GlobeAmericas,
    AcademicCap,
    Banknotes,
    BuildingOffice2,
  } from 'svelte-hero-icons/dist'

  // ETNOS: Provincial Dashboard
  // Each deployment is per-province. Dashboard shows provincial open data.
  // Future: AI-generated charts refreshed weekly, pulling from BPS & government APIs.

  const stats = [
    { label: 'Pengguna Aktif', value: '—', icon: UserGroup, color: 'text-blue-500' },
    { label: 'Postingan Hari Ini', value: '—', icon: ChatBubbleLeftRight, color: 'text-green-500' },
    { label: 'Komunitas', value: '—', icon: GlobeAmericas, color: 'text-amber-500' },
    { label: 'Data Bahasa', value: '—', icon: ChartBar, color: 'text-purple-500' },
  ]

  // ETNOS: Provincial data categories (placeholder)
  // For Papua: OTSUS, education, investment, quality of life
  // For any province: APBN, living quality, education, investment
  const dataCategories = [
    { label: 'Pendidikan', icon: AcademicCap, color: 'text-blue-500',
      desc: 'Angka partisipasi sekolah, literasi, jumlah guru & sekolah' },
    { label: 'Ekonomi & APBD', icon: Banknotes, color: 'text-green-500',
      desc: 'Alokasi APBD, dana OTSUS, investasi, PDRB' },
    { label: 'Infrastruktur', icon: BuildingOffice2, color: 'text-orange-500',
      desc: 'Jalan, listrik, air bersih, telekomunikasi' },
    { label: 'Kualitas Hidup', icon: UserGroup, color: 'text-pink-500',
      desc: 'IPM, kesehatan, harapan hidup, kemiskinan' },
  ]

  // ETNOS: Future implementation plans (commented in for reference)
  // - Data sources:
  //   - BPS Provinsi Papua (papua.bps.go.id) — demographic & economic stats
  //   - Pemerintah Provinsi Papua (papua.go.id) — government data
  //   - Open data portals — satudata.go.id
  // - AI-generated charts:
  //   - LLM generates chart configs (Chart.js/D3) from BPS data
  //   - Refreshed weekly for data, daily for news summaries
  //   - Component: src/lib/etnos/DashboardChart.svelte
  // - OTSUS tracker (Papua-specific):
  //   - Track otonomi khusus fund allocation and usage
  //   - Transparency dashboard for public accountability
</script>

<svelte:head>
  <title>Dashboard Papua</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <EndPlaceholder size="lg">Dashboard Papua</EndPlaceholder>

  <!-- Community stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {#each stats as stat}
      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800
                  flex flex-col gap-2 items-center text-center">
        <Icon src={stat.icon} size="24" class={stat.color} />
        <span class="text-2xl font-bold dark:text-white">{stat.value}</span>
        <span class="text-sm text-slate-500 dark:text-zinc-400">{stat.label}</span>
      </div>
    {/each}
  </div>

  <!-- Provincial data categories -->
  <EndPlaceholder size="sm">Data Provinsi</EndPlaceholder>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    {#each dataCategories as cat}
      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex gap-4 items-start">
        <div class="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
          <Icon src={cat.icon} size="24" class={cat.color} />
        </div>
        <div class="flex flex-col gap-1">
          <h3 class="font-semibold dark:text-white">{cat.label}</h3>
          <p class="text-sm text-slate-500 dark:text-zinc-400">{cat.desc}</p>
          <span class="text-xs text-slate-400 dark:text-zinc-500 mt-1">Data segera hadir...</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- AI Agents section -->
  <EndPlaceholder size="sm">AI Agents</EndPlaceholder>
  <div class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
    <p class="text-slate-500 dark:text-zinc-400 text-sm">
      Status agen AI Jayapura akan ditampilkan di sini. Agen-agen ini memantau
      sumber informasi lokal dan memberikan ringkasan pembaruan untuk komunitas.
    </p>
  </div>
</div>
