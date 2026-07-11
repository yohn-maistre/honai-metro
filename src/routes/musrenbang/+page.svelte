<script lang="ts">
  /**
   * Usulan Musrenbang: the citizen proposal composer (spec etnos/08).
   * It composes a structured proposal and hands it to the EXISTING post
   * flow (/create/post?crosspost=...), with no parallel submit path and
   * no pretend pipeline to government systems. The tracker shows the real
   * road a usulan travels; only the first step happens here, and the page
   * says so.
   */
  import { goto } from '$app/navigation'
  import { fetchUsulan, MUSRENBANG_COMMUNITY } from '$lib/etnos/musrenbang'
  import { Board, DataChip, IconTile, PageHeader } from '$lib/etnos/ui'
  import { postLink } from '$lib/feature/post/helpers'
  import type { PostView } from '$lib/api/types'
  import {
    Button,
    Material,
    Note,
    Option,
    Select,
    TextArea,
    TextInput,
    toast,
  } from 'mono-svelte'
  import {
    CalendarDays,
    DocumentText,
    QuestionMarkCircle,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  // Usulan already discussed on the forum, when a community is designated.
  let usulan = $state<PostView[]>([])
  $effect(() => {
    if (MUSRENBANG_COMMUNITY)
      fetchUsulan(MUSRENBANG_COMMUNITY).then((p) => (usulan = p))
  })

  function relTime(published: string): string {
    const t = Date.parse(published.endsWith('Z') ? published : published + 'Z')
    const d = Math.max(0, Date.now() - t)
    const h = Math.floor(d / 3_600_000)
    if (h < 1) return 'baru saja'
    if (h < 24) return `${h} jam lalu`
    return `${Math.floor(h / 24)} hari lalu`
  }

  let judul = $state('')
  let kampung = $state('')
  let kabupaten = $state('')
  let kategori = $state('infrastruktur')
  let biaya = $state('tidak-tahu')
  let narasi = $state('')

  const KATEGORI: Record<string, string> = {
    infrastruktur: 'Infrastruktur',
    pendidikan: 'Pendidikan',
    kesehatan: 'Kesehatan',
    ekonomi: 'Ekonomi dan mata pencaharian',
    lingkungan: 'Lingkungan dan hutan',
    'sosial-budaya': 'Sosial dan budaya',
  }

  const BIAYA: Record<string, string> = {
    'lt-50': 'Di bawah Rp50 juta',
    '50-250': 'Rp50 sampai 250 juta',
    '250-1000': 'Rp250 juta sampai Rp1 miliar',
    'gt-1000': 'Di atas Rp1 miliar',
    'tidak-tahu': 'Belum tahu, perlu kajian',
  }

  const TAHAPAN = [
    { label: 'Diajukan warga', note: 'di ETNOS, langkah ini' },
    { label: 'Musyawarah kampung', note: 'kesepakatan RT dan kampung' },
    { label: 'Musrenbang distrik', note: 'daftar prioritas distrik' },
    { label: 'Musrenbang kabupaten', note: 'sinkronisasi OPD' },
    { label: 'APBD dan DPA', note: 'penganggaran dan pelaksanaan' },
  ]

  let valid = $derived(
    judul.trim().length > 4 &&
      kampung.trim().length > 1 &&
      narasi.trim().length > 20,
  )

  function composeMarkdown(): { name: string; body: string } {
    const name = `[USULAN] ${judul.trim()}, ${kampung.trim()}`
    const body = [
      '> **Protokol demonstrasi.** Usulan disusun lewat ETNOS dan dibahas di forum. Belum tersambung ke sistem musrenbang resmi.',
      '',
      '## Usulan Musrenbang',
      '',
      '| Bidang | Isi |',
      '| --- | --- |',
      `| Kampung atau distrik | ${kampung.trim()} |`,
      `| Kabupaten | ${kabupaten.trim() || '-'} |`,
      `| Kategori | ${KATEGORI[kategori]} |`,
      `| Perkiraan biaya | ${BIAYA[biaya]} |`,
      '',
      '### Narasi usulan',
      '',
      narasi.trim(),
      '',
      '### Tahapan usulan',
      '',
      ...TAHAPAN.map((t, i) => `${i + 1}. ${t.label}, ${t.note}`),
      '',
      '_Disusun lewat halaman /musrenbang di ETNOS._',
    ].join('\n')
    return { name, body }
  }

  function keForum() {
    const init = composeMarkdown()
    goto(`/create/post?crosspost=${encodeURIComponent(JSON.stringify(init))}`)
  }

  async function salin() {
    const { name, body } = composeMarkdown()
    try {
      await navigator.clipboard.writeText(`# ${name}\n\n${body}`)
      toast({ content: 'Markdown usulan tersalin.' })
    } catch {
      toast({
        content: 'Gagal menyalin. Salin manual dari forum.',
        type: 'error',
      })
    }
  }
</script>

<svelte:head>
  <title>Usulan Musrenbang · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <PageHeader
    title="Usulan Musrenbang"
    lede="Susun usulan pembangunan kampung dalam format yang rapi dan siap dibawa ke musyawarah. Usulan diposkan ke forum untuk dibahas terbuka. Halaman ini belum tersambung ke sistem musrenbang resmi, dan tidak berpura-pura tersambung."
  />

  <!-- the question this page exists to answer -->
  <Material color="default" rounding="2xl" padding="lg" class="flex gap-4">
    <IconTile icon={QuestionMarkCircle} size="md" class="mt-0.5" />
    <div class="flex flex-col gap-1.5 min-w-0">
      <h3 class="font-semibold dark:text-white">
        Apa yang terjadi dengan usulan saya?
      </h3>
      <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
        Setiap tahun warga menyampaikan usulan pembangunan, dan setiap tahun
        sebagian besar tidak pernah tahu nasib usulannya. Halaman ini membuat
        langkah pertama tercatat terbuka: usulan disusun rapi, dibahas di
        forum, dan bisa dirujuk kembali tahun depan. Tahapan berikutnya
        tercatat di sini ketika kerja sama resmi dengan pemerintah terjalin.
      </p>
    </div>
  </Material>

  <!-- the road a real usulan travels -->
  <Material color="default" rounding="2xl" padding="lg">
    <h3 class="font-semibold dark:text-white mb-4">Tahapan usulan</h3>
    <ol class="flex flex-col sm:flex-row gap-4 sm:gap-0">
      {#each TAHAPAN as t, i (t.label)}
        {#if i > 0}
          <li
            aria-hidden="true"
            class="hidden sm:block h-px bg-slate-200 dark:bg-zinc-800 w-6 shrink-0 mt-3.5 mx-1"
          ></li>
        {/if}
        <li class="sm:flex-1 flex sm:flex-col gap-3 sm:gap-2 min-w-0">
          <span
            class={[
              'w-7 h-7 shrink-0 rounded-full grid place-items-center text-xs font-semibold',
              i === 0
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400',
            ]}
          >
            {i + 1}
          </span>
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="text-sm font-medium dark:text-white">{t.label}</span>
            <span class="text-xs text-slate-500 dark:text-zinc-400">
              {t.note}
            </span>
          </div>
        </li>
      {/each}
    </ol>
  </Material>

  <!-- the composer -->
  <form
    class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xs border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 flex flex-col gap-4"
    onsubmit={(e) => {
      e.preventDefault()
      if (valid) keForum()
    }}
  >
    <TextInput
      label="Judul usulan"
      placeholder="Perbaikan jembatan kampung"
      bind:value={judul}
      required
    />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TextInput
        label="Kampung atau distrik"
        placeholder="Kampung, Distrik"
        bind:value={kampung}
        required
      />
      <TextInput
        label="Kabupaten (opsional)"
        placeholder="Nabire"
        bind:value={kabupaten}
      />
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Select label="Kategori" bind:value={kategori}>
        {#each Object.entries(KATEGORI) as [v, label] (v)}
          <Option value={v}>{label}</Option>
        {/each}
      </Select>
      <Select label="Perkiraan biaya" bind:value={biaya}>
        {#each Object.entries(BIAYA) as [v, label] (v)}
          <Option value={v}>{label}</Option>
        {/each}
      </Select>
    </div>
    <TextArea
      label="Narasi usulan"
      placeholder="Apa masalahnya, siapa yang terdampak, dan apa yang diusulkan."
      bind:value={narasi}
      rows={6}
      required
    />
    <div class="flex gap-2 flex-wrap">
      <Button color="primary" size="lg" submit disabled={!valid}>
        Bahas di forum
      </Button>
      <Button color="secondary" size="lg" onclick={salin} disabled={!valid}>
        Salin markdown
      </Button>
    </div>
    <p class="text-xs text-slate-400 dark:text-zinc-500">
      "Bahas di forum" membuka formulir pos berisi usulan ini, lewat jalur pos
      yang sama dengan pos lain, tanpa jalur khusus.
    </p>
  </form>

  <!-- usulan already on the forum: real posts or an honest empty state -->
  <Board title="Usulan di forum">
    {#snippet action()}
      {#if MUSRENBANG_COMMUNITY && usulan.length}
        <DataChip state="langsung" />
      {/if}
    {/snippet}
    {#if MUSRENBANG_COMMUNITY && usulan.length}
      <ul class="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800">
        {#each usulan as p (p.post.id)}
          <li>
            <a
              href={postLink(p.post)}
              class="group flex items-baseline gap-3 px-4 py-2.5 no-underline"
            >
              <span
                class="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate flex-1 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
              >
                {p.post.name}
              </span>
              <span
                class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums shrink-0"
              >
                ▲{p.counts.score} · {relTime(p.post.published)}
              </span>
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="px-4 py-4 flex flex-col gap-2">
        <p class="text-sm text-slate-600 dark:text-zinc-400">
          Komunitas musrenbang belum dibuka di instance ini. Usulan yang
          diposkan lewat halaman ini memakai awalan
          <span class="font-medium">[USULAN]</span> dan dapat dicari di forum.
        </p>
        <a
          href="/search?q=%5BUSULAN%5D&type=Posts"
          class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline self-start"
        >
          Cari usulan di forum
        </a>
      </div>
    {/if}
  </Board>

  <!-- panduan: who, when, how -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <Material color="default" rounding="2xl" padding="lg" class="flex flex-col gap-2">
      <IconTile icon={UserGroup} size="sm" />
      <h4 class="text-sm font-semibold dark:text-white">
        Siapa bisa mengusulkan
      </h4>
      <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        Setiap warga. Usulan paling kuat datang dari kesepakatan bersama:
        bicarakan dulu di tingkat RT atau kampung, lalu satu orang menyusunnya
        di sini atas nama musyawarah.
      </p>
    </Material>
    <Material color="default" rounding="2xl" padding="lg" class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <IconTile icon={CalendarDays} size="sm" />
        <DataChip state="contoh" />
      </div>
      <h4 class="text-sm font-semibold dark:text-white">
        Jadwal musim musrenbang
      </h4>
      <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        Pola umum tiap tahun: musyawarah kampung sekitar Januari, musrenbang
        distrik Februari, kabupaten Maret, lalu penyusunan APBD hingga akhir
        tahun. Jadwal pasti ditetapkan tiap pemerintah daerah.
      </p>
    </Material>
    <Material color="default" rounding="2xl" padding="lg" class="flex flex-col gap-2">
      <IconTile icon={DocumentText} size="sm" />
      <h4 class="text-sm font-semibold dark:text-white">
        Format usulan yang baik
      </h4>
      <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        Sebut masalahnya, siapa yang terdampak dan berapa orang, apa yang
        diusulkan, dan kira-kira biayanya. Satu usulan untuk satu kebutuhan
        lebih mudah dibahas daripada daftar panjang.
      </p>
    </Material>
  </div>

  <Note>
    Format usulan mengikuti alur musrenbang: kampung, distrik, kabupaten, lalu
    APBD. Ketika kerja sama resmi terjalin, tahap 2 sampai 5 akan tercatat di
    sini. Sampai saat itu, halaman ini jujur berhenti di langkah pertama.
  </Note>
</div>
