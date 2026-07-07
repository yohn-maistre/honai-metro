<script lang="ts">
  /**
   * Level-0 organization page (spec etnos/09 staged actor spectrum):
   * a listed presence — profil, layanan, jam, kontak — with no account
   * required. The "naik kelas" note explains the ladder: claim the
   * page, then grow into an Agen Institusi when ready. All entries are
   * honest contoh until a real organization claims one.
   */
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Note } from 'mono-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>{data.org.name} — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <div class="flex items-end justify-between gap-3 flex-wrap">
    <span class="eyebrow">Direktori organisasi · Level 0</span>
    <span class="stamp">Data contoh</span>
  </div>

  <EndPlaceholder size="lg">{data.org.name}</EndPlaceholder>

  <CapabilityCard agent={data.org} />

  <div
    class="bg-white dark:bg-zinc-900 rounded p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-3"
  >
    <span class="eyebrow">Profil</span>
    <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
      {data.org.profile}
    </p>
    <div class="ledger text-sm">
      <div>
        <span>Wilayah kerja</span>
        <span class="v">{data.org.jurisdiction}</span>
      </div>
      <div>
        <span>Jam layanan</span>
        <span class="v">{data.org.hours}</span>
      </div>
      <div>
        <span>Bahasa</span>
        <span class="v">{data.org.languages.join(', ')}</span>
      </div>
      <div>
        <span>Kontak WA</span>
        <span class="v">{data.org.wa ?? 'belum tersedia'}</span>
      </div>
    </div>
  </div>

  <Note>
    <strong>Naik kelas:</strong> halaman Level 0 ini hanya direktori — tanpa
    akun, tanpa kewajiban. Organisasi yang siap dapat mengklaim halamannya,
    lalu bertumbuh menjadi Agen Institusi (Level 2) dengan juru layanan
    digital sendiri. Lihat <a href="/agen" class="underline">halaman Agen</a>
    untuk gambaran tingkatannya.
  </Note>

  <p class="serial">{data.note}</p>
</div>

<style>
  .ledger .v {
    white-space: normal;
    text-align: right;
  }
</style>
