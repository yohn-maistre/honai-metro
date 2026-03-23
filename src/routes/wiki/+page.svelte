<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { CommonList } from '$lib/ui/layout'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import Markdown from '$lib/app/markdown/Markdown.svelte'

  // ETNOS: Wiki page — placeholder content for now
  // Future: pull from a Lemmy community (c/wiki) or external source
  const wikiContent = `
## Selamat datang di Wiki ETNOS 🏠

Wiki ini adalah tempat untuk berbagi pengetahuan tentang budaya, bahasa, dan sejarah Papua.

### Bahasa Mee
Bahasa Mee (juga dikenal sebagai Ekagi atau Ekari) adalah bahasa yang dituturkan oleh suku Mee di dataran tinggi Papua. Bahasa ini memiliki sekitar 100.000 penutur.

### Tentang ETNOS
ETNOS adalah upaya untuk melestarikan bahasa dan budaya masyarakat Papua melalui teknologi. Platform ini mengumpulkan data bahasa dari percakapan sehari-hari untuk membantu pengembangan model AI yang memahami bahasa-bahasa daerah Papua.

### Cara Berkontribusi
1. **Berbicara** — Gunakan bahasa daerah Anda di forum ini
2. **Menulis** — Tambahkan artikel tentang budaya dan sejarah
3. **Memvalidasi** — Bantu periksa terjemahan dan konten

---

*Halaman ini masih dalam pengembangan. Konten akan terus ditambahkan.*

<!--
// ETNOS: Future data sources to explore:
// - Wikipedia API for Papua articles (id.wikipedia.org/wiki/Papua)
// - Community-contributed content via Lemmy community (c/wiki)
// - Static markdown files in src/lib/etnos/wiki/
-->
`
</script>

<svelte:head>
  <title>Wiki</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <EndPlaceholder size="lg">Wiki</EndPlaceholder>
  <div class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
    <Markdown source={wikiContent} />
  </div>
</div>
