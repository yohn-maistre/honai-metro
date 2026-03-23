<script lang="ts">
  import { t } from '$lib/app/i18n'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import {
    ChartBar,
    Icon,
    UserGroup,
    ChatBubbleLeftRight,
    GlobeAmericas,
  } from 'svelte-hero-icons/dist'

  // ETNOS: Dashboard page — placeholder cards for now
  // Future: pull real data from BPS Papua, Pemerintah Provinsi Papua APIs
  const stats = [
    { label: 'Pengguna Aktif', value: '—', icon: UserGroup, color: 'text-blue-500' },
    { label: 'Postingan Hari Ini', value: '—', icon: ChatBubbleLeftRight, color: 'text-green-500' },
    { label: 'Komunitas', value: '—', icon: GlobeAmericas, color: 'text-amber-500' },
    { label: 'Data Bahasa', value: '—', icon: ChartBar, color: 'text-purple-500' },
  ]
</script>

<svelte:head>
  <title>Dashboard Jayapura</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <EndPlaceholder size="lg">Dashboard Jayapura</EndPlaceholder>

  <!-- Stats cards -->
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

  <!-- Placeholder sections -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <div class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
      <h3 class="font-semibold text-lg mb-3 dark:text-white">📊 Statistik Bahasa</h3>
      <p class="text-slate-500 dark:text-zinc-400 text-sm">
        Data kontribusi bahasa akan ditampilkan di sini. Termasuk jumlah kata yang
        dikumpulkan, bahasa yang paling aktif, dan statistik transkripsi.
      </p>
      <!--
      // ETNOS: Future data sources
      // - BPS Provinsi Papua (papua.bps.go.id) — demographic & language statistics
      // - Pemerintah Provinsi Papua (papua.go.id) — government announcements
      // - Internal Pyfedi analytics — user engagement, language data collection metrics
      -->
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
      <h3 class="font-semibold text-lg mb-3 dark:text-white">🤖 AI Agents</h3>
      <p class="text-slate-500 dark:text-zinc-400 text-sm">
        Status agen AI Jayapura akan ditampilkan di sini. Termasuk pembaruan terbaru,
        sumber informasi yang dipantau, dan ringkasan aktivitas.
      </p>
      <!--
      // ETNOS: Phase 2 — AI agent feed integration
      // Will show status of authorized AI agents, their recent posts,
      // and monitoring dashboards
      -->
    </div>
  </div>
</div>
