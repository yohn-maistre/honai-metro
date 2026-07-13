<script lang="ts">
  /**
   * Wajah Tanah Papua: the wiki's rotating feature, detak-detik's
   * ensiklopedia pattern in Honai Metro dress. A reviewed registry
   * (wajah.json, every entry manually verified against id.wikipedia +
   * Commons) rotates on a deterministic 12-hour slot, same entry for
   * every reader. On mount the live Wikipedia summary may only LENGTHEN
   * the reviewed extract; text is verbatim encyclopedia either way. The
   * label is honest: langsung when the live fetch answered, arsip
   * redaksi otherwise. Images are hotlinked from Commons with license +
   * attribution printed; entries without an attributable image show the
   * locator plate instead.
   */
  import { onMount } from 'svelte'
  import { ArrowTopRightOnSquare, Icon } from 'svelte-hero-icons/dist'
  import { t } from '$lib/app/i18n'
  import LocatorPlate from './LocatorPlate.svelte'
  import wajah from './wiki/wajah.json'
  import { DataChip } from './ui'

  interface Entry {
    id: string
    jenis: string
    nama: string
    wikipedia: { judul: string; url: string }
    ringkas: string
    gambar: { url: string; lisensi: string; atribusi: string } | null
    koordinat: number[] | null
    bahasa?: string
    komunitas?: string
    kategori: string
  }

  const entries = (wajah.entries as Entry[])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))

  // Deterministic 12h slot, anchored to the epoch: every reader sees the
  // same face today, pagi and sore differ.
  const entry = entries[Math.floor(Date.now() / 43_200_000) % entries.length]!

  let extract = $state(entry.ringkas)
  let live = $state(false)
  let imgBroken = $state(false)

  function capWord(s: string, n = 900) {
    if (s.length <= n) return s
    const cut = s.slice(0, n)
    return cut.slice(0, cut.lastIndexOf(' ')) + ' …'
  }

  onMount(() => {
    void fetch(
      `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entry.wikipedia.judul)}`,
      { signal: AbortSignal.timeout(8000) },
    )
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d: { extract?: string } | null) => {
        if (!d?.extract) return
        // only lengthen the reviewed extract, never shrink it
        if (d.extract.trim().length > extract.length)
          extract = capWord(d.extract.trim())
        live = true
      })
      .catch(() => {})
  })

  const koordinatLabel = $derived.by(() => {
    if (!entry.koordinat) return null
    const [lat, lon] = entry.koordinat
    return `${Math.abs(lat!).toFixed(2)}°${lat! < 0 ? 'LS' : 'LU'} ${Math.abs(lon!).toFixed(2)}°BT`
  })
</script>

<!-- lead story: pure editorial on the paper, rules above and below -->
<article
  class="w-full border-y border-slate-200/70 dark:border-zinc-800 py-5"
>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] items-start">
    <div class="flex flex-col gap-3 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-semibold text-primary-700 dark:text-primary-300">
          {$t('etnos.wiki.wajah_title')} · {entry.jenis}
        </span>
        {#if live}
          <DataChip state="langsung" label="id.wikipedia" />
        {:else}
          <span class="text-xs text-slate-500 dark:text-zinc-400">
            {$t('etnos.wiki.wajah_arsip')}
          </span>
        {/if}
      </div>

      <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
        {entry.nama}
      </h2>

      <p class="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed">
        {extract}
      </p>

      <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
        {#if entry.bahasa}bahasa {entry.bahasa} · {/if}
        {#if koordinatLabel}{koordinatLabel} · {/if}
        {$t('etnos.wiki.wajah_rotasi')}
      </p>

      <div class="flex items-center gap-4 flex-wrap text-sm">
        <a
          href={entry.wikipedia.url}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          id.wikipedia
          <Icon src={ArrowTopRightOnSquare} micro size="13" />
        </a>
        <a
          href="/wiki/{entry.kategori}"
          class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          {$t('etnos.wiki.wajah_kategori')}
        </a>
        {#if entry.komunitas}
          <a
            href={entry.komunitas}
            class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {entry.komunitas}
          </a>
        {/if}
      </div>
    </div>

    <figure class="flex flex-col gap-1.5 min-w-0">
      {#if entry.gambar && !imgBroken}
        <img
          src={entry.gambar.url}
          alt={entry.nama}
          loading="lazy"
          onerror={() => (imgBroken = true)}
          class="w-full max-h-64 object-cover rounded-xl border border-slate-200 dark:border-zinc-800"
        />
        <figcaption class="text-xs text-slate-500 dark:text-zinc-400">
          {entry.nama}, {entry.gambar.atribusi} ({entry.gambar.lisensi}), via
          Wikimedia Commons
        </figcaption>
      {/if}
      {#if entry.koordinat}
        <LocatorPlate
          koordinat={entry.koordinat}
          class={entry.gambar && !imgBroken ? 'h-20 mt-2' : 'h-28'}
        />
        <figcaption class="text-xs text-slate-500 dark:text-zinc-400">
          {$t('etnos.wiki.wajah_plate')}
        </figcaption>
      {/if}
    </figure>
  </div>
</article>
