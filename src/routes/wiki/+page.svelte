<script lang="ts">
  import { t } from '$lib/app/i18n'
  import Markdown from '$lib/app/markdown/Markdown.svelte'
  import WikiCarousel from '$lib/etnos/WikiCarousel.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'

  let { data } = $props()

  // ETNOS: Provincial Wiki page.
  // - Carousel: Hari Ini Dalam Sejarah Papua + Kata Hari Ini (TTS)
  // - Category buttons link to /wiki/[category] (markdown rendered from
  //   src/lib/etnos/wiki/*.md)
  // - Future: enrich via Wikipedia API (id.wikipedia.org) in load fns,
  //   community posts via c/wiki, LLM-refreshed carousel content.

  type CategoryKey =
    | 'tempat'
    | 'sejarah'
    | 'biodiversitas'
    | 'suku-bahasa'
    | 'kuliner'

  const categories: { slug: CategoryKey; emoji: string }[] = [
    { slug: 'tempat', emoji: '📍' },
    { slug: 'sejarah', emoji: '📚' },
    { slug: 'biodiversitas', emoji: '🌿' },
    { slug: 'suku-bahasa', emoji: '👥' },
    { slug: 'kuliner', emoji: '🍲' },
  ]

  const intro = `
## Selamat datang di Wiki Papua 🏠

Wiki ini berisi informasi tentang Tanah Papua — budaya, sejarah, bahasa, dan
kekayaan alam. Konten dirawat manual dan akan diperkaya dengan kontribusi
komunitas melalui forum \`c/wiki\` serta data dari Wikipedia.

Klik salah satu kategori di atas untuk mulai membaca, atau dengarkan
**Hari Ini Dalam Sejarah** dan **Kata Hari Ini** di kartu sorotan.

### 🤝 Cara berkontribusi
1. **Berbicara** — gunakan bahasa daerah Anda di forum komunitas.
2. **Menulis** — tambah cerita tentang budaya dan sejarah lewat \`c/wiki\`.
3. **Memvalidasi** — bantu periksa terjemahan dan konten.
`
</script>

<svelte:head>
  <title>Wiki Papua — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <WikiCarousel history={data.todayHistory} word={data.todayWord} />

  <EndPlaceholder size="lg">Wiki Papua</EndPlaceholder>

  <div class="flex flex-wrap gap-2">
    {#each categories as cat (cat.slug)}
      <a
        href="/wiki/{cat.slug}"
        class="px-3 py-1.5 rounded-xl text-sm font-medium
               bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300
               hover:bg-primary-100 hover:dark:bg-primary-900 transition-colors"
      >
        {cat.emoji}
        {$t(`etnos.wiki.categories.${cat.slug.replace(/-/g, '_')}`)}
      </a>
    {/each}
  </div>

  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <Markdown source={intro} />
  </div>
</div>
