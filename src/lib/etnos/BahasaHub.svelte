<script lang="ts">
  /**
   * The language directory, moved from the retired /bahasa route into the
   * wiki language hub (/wiki/bahasa). One fact, one owner: explore's
   * Bahasa cluster keeps community links only, this hub owns the data.
   * Speaker counts are estimates and say so.
   */
  import { Badge } from 'mono-svelte'

  interface Language {
    name: string
    native: string
    speakers: string
    region: string
    family: string
    slug: string
    status: string
  }

  interface Props {
    languages: Language[]
  }

  let { languages }: Props = $props()

  const statusColor = (
    status: string,
  ): 'green-subtle' | 'yellow-subtle' | 'red-subtle' => {
    switch (status) {
      case 'vital':
        return 'green-subtle'
      case 'definitely_endangered':
        return 'yellow-subtle'
      case 'severely_endangered':
      case 'critically_endangered':
        return 'red-subtle'
      default:
        return 'yellow-subtle'
    }
  }

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'vital':
        return 'Vital'
      case 'definitely_endangered':
        return 'Terancam'
      case 'severely_endangered':
        return 'Sangat terancam'
      case 'critically_endangered':
        return 'Kritis'
      default:
        return status
    }
  }
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-baseline justify-between gap-3 flex-wrap">
    <h2 class="text-lg font-semibold dark:text-white">Direktori bahasa</h2>
    <span class="text-xs text-slate-400 dark:text-zinc-500">
      Ethnologue / Badan Bahasa, angka perkiraan
    </span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each languages as lang (lang.slug)}
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xs border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 flex flex-col gap-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-0.5 min-w-0">
            <h3 class="font-semibold dark:text-white">{lang.name}</h3>
            <p class="text-sm italic text-slate-500 dark:text-zinc-400">
              {lang.native}
            </p>
          </div>
          <Badge color={statusColor(lang.status)}>
            {statusLabel(lang.status)}
          </Badge>
        </div>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt class="text-slate-500 dark:text-zinc-500">Penutur</dt>
          <dd class="text-slate-700 dark:text-zinc-300 text-right">
            {lang.speakers}
          </dd>
          <dt class="text-slate-500 dark:text-zinc-500">Wilayah</dt>
          <dd class="text-slate-700 dark:text-zinc-300 text-right">
            {lang.region}
          </dd>
          <dt class="text-slate-500 dark:text-zinc-500">Rumpun</dt>
          <dd class="text-slate-700 dark:text-zinc-300 text-right">
            {lang.family}
          </dd>
        </dl>
        <a
          href="/c/bahasa-{lang.slug}"
          class="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1"
        >
          /c/bahasa-{lang.slug}
        </a>
      </div>
    {/each}
  </div>
</div>
