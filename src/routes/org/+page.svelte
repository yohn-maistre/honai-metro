<script lang="ts">
  /**
   * The Level-0 organization directory index: every listed org, one card
   * each, all sample data until real organizations claim them. Filter
   * chips by jenis; buka-sekarang computed honestly from stated hours.
   */
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import { bukaSekarang, type Jam } from '$lib/etnos/org'
  import { DataChip, IconTile, PageHeader } from '$lib/etnos/ui'
  import { Material, Note } from 'mono-svelte'
  import { BuildingLibrary } from 'svelte-hero-icons/dist'

  let { data } = $props()

  const JENIS: Record<string, string> = {
    pemerintahan: 'Pemerintahan',
    kesehatan: 'Kesehatan',
    pendidikan: 'Pendidikan',
    adat: 'Adat',
    ekonomi: 'Ekonomi',
    masyarakat: 'Masyarakat',
  }

  let jenis = $state<string | null>(null)

  const filtered = $derived(
    jenis
      ? data.orgs.filter((o: { jenis?: string }) => o.jenis === jenis)
      : data.orgs,
  )

  const countOf = (j: string) =>
    data.orgs.filter((o: { jenis?: string }) => o.jenis === j).length

  const LADDER = [
    {
      level: 'Level 0 · tercantum',
      desc: 'Profil, layanan, dan jam buka tercatat di direktori. Tanpa akun, tanpa kewajiban, tanpa biaya.',
    },
    {
      level: 'Level 1 · terklaim',
      desc: 'Organisasi mengklaim halamannya, memperbarui sendiri isinya, dan menjawab warga lewat forum.',
    },
    {
      level: 'Level 2 · agen institusi',
      desc: 'Organisasi menjalankan simpul Aksara teratestasi dengan juru layanan digital. Lihat halaman Agen untuk tingkat kepercayaannya.',
    },
  ]
</script>

<svelte:head>
  <title>Direktori Organisasi · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <PageHeader
    title="Direktori Organisasi"
    lede="Kehadiran Level 0: organisasi tercantum dengan profil, layanan, dan jam buka, tanpa akun dan tanpa kewajiban. Organisasi yang siap dapat mengklaim halamannya dan bertumbuh menjadi Agen Institusi."
  >
    {#snippet actions()}
      <DataChip state="contoh" />
    {/snippet}
  </PageHeader>

  <div class="flex gap-1.5 overflow-x-auto">
    <button
      type="button"
      class={[
        'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
        jenis === null
          ? 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950'
          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700',
      ]}
      onclick={() => (jenis = null)}
    >
      Semua <span class="opacity-60 tabular-nums">{data.orgs.length}</span>
    </button>
    {#each Object.entries(JENIS) as [j, label] (j)}
      {#if countOf(j) > 0}
        <button
          type="button"
          class={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            jenis === j
              ? 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700',
          ]}
          onclick={() => (jenis = jenis === j ? null : j)}
        >
          {label} <span class="opacity-60 tabular-nums">{countOf(j)}</span>
        </button>
      {/if}
    {/each}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each filtered as org (org.slug)}
      <a href="/org/{org.slug}" class="contents">
        <CapabilityCard agent={org} open={bukaSekarang(org.jam as Jam | null)} />
      </a>
    {/each}
  </div>

  <!-- the ladder: how a listed org grows -->
  <Material color="default" rounding="2xl" padding="lg" class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <IconTile icon={BuildingLibrary} size="md" />
      <h3 class="font-semibold dark:text-white">Tangga kehadiran</h3>
    </div>
    <ol class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {#each LADDER as step, i (step.level)}
        <li class="flex flex-col gap-1.5">
          <span
            class={[
              'w-7 h-7 rounded-full grid place-items-center text-xs font-semibold',
              i === 0
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400',
            ]}
          >
            {i}
          </span>
          <span class="text-sm font-medium dark:text-white">{step.level}</span>
          <span class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            {step.desc}
          </span>
        </li>
      {/each}
    </ol>
  </Material>

  <Note>
    <strong>Klaim halaman.</strong> Mewakili salah satu jenis organisasi ini?
    Sampaikan lewat forum atau kontak di halaman
    <a href="/tentang#klaim" class="underline">Tentang</a> untuk mengklaim dan
    memperbarui halaman organisasi Anda. Label contoh dilepas begitu halaman
    diklaim pemiliknya.
  </Note>

  <p class="text-xs text-slate-400 dark:text-zinc-500">{data.note}</p>
</div>
