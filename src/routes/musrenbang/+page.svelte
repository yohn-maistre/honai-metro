<script lang="ts">
  /**
   * Usulan Musrenbang — the citizen proposal composer (spec etnos/08).
   * PROTOKOL DEMONSTRASI: this composes a structured proposal and hands
   * it to the EXISTING post flow (/create/post?crosspost=...) — no
   * parallel submit path, no pretend pipeline to government systems.
   * The 5-stage tracker shows where a real usulan travels; only stage 1
   * happens here today, and the page says so.
   */
  import { goto } from '$app/navigation'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import {
    Button,
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
    ekonomi: 'Ekonomi & mata pencaharian',
    lingkungan: 'Lingkungan & hutan',
    'sosial-budaya': 'Sosial & budaya',
  }

  const BIAYA: Record<string, string> = {
    'lt-50': 'Di bawah Rp50 juta',
    '50-250': 'Rp50–250 juta',
    '250-1000': 'Rp250 juta – Rp1 miliar',
    'gt-1000': 'Di atas Rp1 miliar',
    'tidak-tahu': 'Belum tahu / perlu kajian',
  }

  const TAHAPAN = [
    { n: '01', label: 'Diajukan warga', note: 'di ETNOS — tahap ini' },
    { n: '02', label: 'Musyawarah kampung', note: 'kesepakatan RT/kampung' },
    { n: '03', label: 'Musrenbang distrik', note: 'daftar prioritas distrik' },
    { n: '04', label: 'Musrenbang kabupaten', note: 'sinkronisasi OPD' },
    { n: '05', label: 'APBD / DPA', note: 'penganggaran & pelaksanaan' },
  ]

  let valid = $derived(
    judul.trim().length > 4 && kampung.trim().length > 1 && narasi.trim().length > 20,
  )

  function composeMarkdown(): { name: string; body: string } {
    const name = `[USULAN] ${judul.trim()} — ${kampung.trim()}`
    const body = [
      '> **PROTOKOL DEMONSTRASI** — usulan disusun lewat ETNOS dan dibahas di forum; belum tersambung ke sistem musrenbang resmi.',
      '',
      '## Usulan Musrenbang',
      '',
      '| Bidang | Isi |',
      '| --- | --- |',
      `| Kampung / Distrik | ${kampung.trim()} |`,
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
      ...TAHAPAN.map((t, i) => `${i + 1}. ${t.label} — ${t.note}`),
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
      toast({ content: 'Gagal menyalin — salin manual dari forum.', type: 'error' })
    }
  }
</script>

<svelte:head>
  <title>Usulan Musrenbang — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <div class="flex items-end justify-between gap-3 flex-wrap">
    <span class="eyebrow">Musrenbang · usulan warga</span>
    <span class="stamp">Protokol demonstrasi</span>
  </div>

  <EndPlaceholder size="lg">Usulan Musrenbang</EndPlaceholder>

  <p class="text-sm text-slate-600 dark:text-zinc-400 max-w-prose">
    Susun usulan pembangunan kampung dalam format yang rapi dan siap dibawa ke
    musyawarah. Usulan diposkan ke forum untuk dibahas terbuka — halaman ini
    belum tersambung ke sistem musrenbang resmi, dan tidak berpura-pura
    tersambung.
  </p>

  <!-- the road a real usulan travels -->
  <div
    class="bg-white dark:bg-zinc-900 rounded p-5 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <span class="eyebrow mb-3">Tahapan usulan</span>
    <ol class="flex flex-col sm:flex-row gap-4 sm:gap-2 mt-3">
      {#each TAHAPAN as t, i (t.n)}
        <li class="flex-1 flex flex-col gap-1 min-w-0">
          <span
            class="serial {i === 0
              ? 'text-primary-700 dark:text-primary-300'
              : ''}"
          >
            {t.n}
          </span>
          <div
            class="rule is-drawn"
            style={i === 0 ? 'background: var(--etnos-accent)' : 'opacity:0.35'}
          ></div>
          <span class="text-sm font-medium font-display dark:text-white">
            {t.label}
          </span>
          <span class="text-xs text-slate-500 dark:text-zinc-400">{t.note}</span>
        </li>
      {/each}
    </ol>
  </div>

  <!-- the composer -->
  <form
    class="bg-white dark:bg-zinc-900 rounded p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-4"
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
        label="Kampung / Distrik"
        placeholder="Kampung …, Distrik …"
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
      placeholder="Apa masalahnya, siapa yang terdampak, dan apa yang diusulkan…"
      bind:value={narasi}
      rows={6}
      required
    />
    <div class="flex gap-2 flex-wrap">
      <Button color="primary" size="lg" submit disabled={!valid}>
        Bahas di forum →
      </Button>
      <Button color="secondary" size="lg" onclick={salin} disabled={!valid}>
        Salin markdown
      </Button>
    </div>
    <p class="serial">
      "Bahas di forum" membuka formulir pos berisi usulan ini — jalur pos yang
      sama dengan pos lain, tanpa jalur khusus.
    </p>
  </form>

  <Note>
    Format usulan mengikuti alur musrenbang (kampung → distrik → kabupaten →
    APBD). Ketika kerja sama resmi terjalin, tahap 2–5 akan tercatat di sini —
    sampai saat itu, halaman ini jujur berhenti di tahap 1.
  </Note>
</div>
