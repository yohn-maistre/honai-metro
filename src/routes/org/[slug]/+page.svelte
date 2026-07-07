<script lang="ts">
  /**
   * Level-0 organization page (spec etnos/09 staged actor spectrum): a
   * listed presence with profil, layanan, jam, and kontak, no account
   * required. The "naik kelas" note explains the ladder. All entries are
   * sample data until a real organization claims one.
   */
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge, Note } from 'mono-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>{data.org.name} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <div class="flex items-center gap-2 flex-wrap">
    <EndPlaceholder size="lg">{data.org.name}</EndPlaceholder>
  </div>
  <Badge color="yellow-subtle" rounding="md">Data contoh</Badge>

  <CapabilityCard agent={data.org} />

  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-3"
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
  </div>

  <Note>
    <strong>Naik kelas.</strong> Halaman Level 0 ini hanya direktori, tanpa akun
    dan tanpa kewajiban. Organisasi yang siap dapat mengklaim halamannya, lalu
    bertumbuh menjadi Agen Institusi dengan juru layanan digital sendiri. Lihat
    <a href="/agen" class="underline">halaman Agen</a> untuk gambaran
    tingkatannya.
  </Note>

  <p class="text-xs text-slate-400 dark:text-zinc-500">{data.note}</p>
</div>
