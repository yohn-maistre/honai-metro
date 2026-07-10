<script lang="ts">
  /**
   * Level-0 organization page (spec etnos/09 staged actor spectrum): a
   * listed presence with profil, layanan, jam, and kontak, no account
   * required. The "naik kelas" note explains the ladder. All entries are
   * sample data until a real organization claims one.
   */
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import { BackLink, DataChip } from '$lib/etnos/ui'
  import { Material, Note } from 'mono-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>{data.org.name} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <BackLink href="/org">Direktori Organisasi</BackLink>

  <header class="flex items-center justify-between gap-3 flex-wrap">
    <h1
      class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50"
    >
      {data.org.name}
    </h1>
    <DataChip state="contoh" />
  </header>

  <CapabilityCard agent={data.org} />

  <Material
    color="default"
    rounding="2xl"
    padding="lg"
    class="flex flex-col gap-3"
  >
    <h3 class="font-semibold dark:text-white">Profil</h3>
    <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
      {data.org.profile}
    </p>
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm mt-1">
      <dt class="text-slate-500 dark:text-zinc-500">Wilayah kerja</dt>
      <dd class="text-slate-700 dark:text-zinc-300 text-right">
        {data.org.jurisdiction}
      </dd>
      <dt class="text-slate-500 dark:text-zinc-500">Jam layanan</dt>
      <dd class="text-slate-700 dark:text-zinc-300 text-right">
        {data.org.hours}
      </dd>
      <dt class="text-slate-500 dark:text-zinc-500">Bahasa</dt>
      <dd class="text-slate-700 dark:text-zinc-300 text-right">
        {data.org.languages.join(', ')}
      </dd>
      <dt class="text-slate-500 dark:text-zinc-500">Kontak WA</dt>
      <dd class="text-slate-700 dark:text-zinc-300 text-right">
        {data.org.wa ?? 'belum tersedia'}
      </dd>
    </dl>
  </Material>

  <Note>
    <strong>Naik kelas.</strong> Halaman Level 0 ini hanya direktori, tanpa akun
    dan tanpa kewajiban. Organisasi yang siap dapat mengklaim halamannya, lalu
    bertumbuh menjadi Agen Institusi dengan juru layanan digital sendiri. Lihat
    <a href="/agen" class="underline">halaman Agen</a> untuk gambaran
    tingkatannya.
  </Note>

  <p class="text-xs text-slate-400 dark:text-zinc-500">{data.note}</p>
</div>
