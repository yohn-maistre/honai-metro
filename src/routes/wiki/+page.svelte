<script lang="ts">
  import { t } from '$lib/app/i18n'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import Markdown from '$lib/app/markdown/Markdown.svelte'

  // ETNOS: Provincial Wiki page
  // Each ETNOS deployment is per-province. This wiki showcases the province.
  // Future: LLM-generated carousel header with "Today in History" facts,
  //         content pulled from Wikipedia/community contributions,
  //         refreshed daily for stories, one-time for articles unless updated.
  const wikiContent = `
## Selamat datang di Wiki Provinsi Papua 🏠

Wiki ini berisi informasi tentang Provinsi Papua — budaya, sejarah, bahasa, dan kekayaan alam.

### 📍 Tempat Menarik
- **Danau Sentani** — Danau terbesar di Papua dengan puluhan pulau kecil
- **Taman Nasional Lorentz** — Situs Warisan Dunia UNESCO, rumah bagi gletser tropis
- **Pantai Base-G** — Pantai bersejarah Perang Dunia II di Jayapura
- **Lembah Baliem** — Lembah indah di dataran tinggi, rumah suku Dani

### 📚 Sejarah
Papua memiliki sejarah panjang yang dimulai jauh sebelum kedatangan bangsa Eropa.
Masyarakat adat telah mendiami pulau ini selama puluhan ribu tahun dengan
keragaman budaya yang luar biasa — lebih dari 250 bahasa daerah.

### 🌿 Keanekaragaman Hayati
Papua adalah rumah bagi burung cenderawasih, kanguru pohon, dan ribuan
spesies tumbuhan yang tidak ditemukan di tempat lain di dunia.

### 👥 Suku dan Bahasa
- **Mee (Ekagi)** — ~100.000 penutur, dataran tinggi
- **Dani** — Lembah Baliem
- **Sentani** — Pesisir Danau Sentani
- **Biak** — Kepulauan Biak

### 🤝 Cara Berkontribusi
1. **Berbicara** — Gunakan bahasa daerah Anda di forum ini
2. **Menulis** — Tambahkan cerita tentang budaya dan sejarah
3. **Memvalidasi** — Bantu periksa terjemahan dan konten

---

*Halaman ini masih dalam pengembangan.*
`

  // ETNOS: Future plans (commented in for reference)
  // - Carousel header: LLM-generated "Hari Ini Dalam Sejarah" facts
  //   Refreshed daily. Could use Gemini/GPT to generate from Wikipedia data.
  //   Component: src/lib/etnos/WikiCarousel.svelte
  // - Wiki categories menu: Tempat, Sejarah, Biodiversitas, Suku & Bahasa, Kuliner
  //   Each category links to a sub-route or filtered view
  // - Content sources:
  //   - id.wikipedia.org API for Papua articles
  //   - Community posts tagged with c/wiki community
  //   - Static markdown files in src/lib/etnos/wiki/
  // - Interactive features via Lemmy:
  //   - Each wiki article = a Lemmy post in c/wiki
  //   - Comments = discussion, upvotes = validation
  //   - Federates to other ETNOS provincial instances for free
</script>

<svelte:head>
  <title>Wiki Papua</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <!-- ETNOS: Future carousel header goes here -->
  <!-- <WikiCarousel /> — "Hari Ini Dalam Sejarah Papua" -->
  <EndPlaceholder size="lg">Wiki Papua</EndPlaceholder>

  <!-- ETNOS: Future category menu -->
  <div class="flex flex-wrap gap-2">
    {#each ['📍 Tempat', '📚 Sejarah', '🌿 Biodiversitas', '👥 Suku & Bahasa', '🍲 Kuliner'] as cat}
      <button class="px-3 py-1.5 rounded-xl text-sm font-medium
                     bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300
                     hover:bg-primary-100 hover:dark:bg-primary-900 transition-colors cursor-pointer">
        {cat}
      </button>
    {/each}
  </div>

  <div class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
    <Markdown source={wikiContent} />
  </div>
</div>
