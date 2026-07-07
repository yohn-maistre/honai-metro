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
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
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
  <EndPlaceholder size="lg">Usulan Musrenbang</EndPlaceholder>

  <p class="text-sm text-slate-600 dark:text-zinc-400 max-w-prose">
    Susun usulan pembangunan kampung dalam format yang rapi dan siap dibawa ke
    musyawarah. Usulan diposkan ke forum untuk dibahas terbuka. Halaman ini
    belum tersambung ke sistem musrenbang resmi, dan tidak berpura-pura
    tersambung.
  </p>

  <!-- the road a real usulan travels -->
  <Material color="default" rounding="2xl" padding="lg" class="shadow-sm">
    <h3 class="font-semibold dark:text-white mb-4">Tahapan usulan</h3>
    <ol class="flex flex-col sm:flex-row gap-4 sm:gap-3">
      {#each TAHAPAN as t, i (t.label)}
        <li class="flex-1 flex sm:flex-col gap-3 sm:gap-2 min-w-0">
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
    class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-4"
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

  <Note>
    Format usulan mengikuti alur musrenbang: kampung, distrik, kabupaten, lalu
    APBD. Ketika kerja sama resmi terjalin, tahap 2 sampai 5 akan tercatat di
    sini. Sampai saat itu, halaman ini jujur berhenti di langkah pertama.
  </Note>
</div>
