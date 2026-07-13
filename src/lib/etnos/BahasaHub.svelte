<script lang="ts">
  /**
   * The language directory, moved from the retired /bahasa route into the
   * wiki language hub (/wiki/bahasa). One fact, one owner: explore's
   * Bahasa cluster keeps community links only, this hub owns the data.
   * Speaker counts are estimates and say so.
   */
  import { Badge } from 'mono-svelte'
  import { SectionHead } from './ui'

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

<div class="flex flex-col gap-1">
  <SectionHead
    title="Direktori bahasa"
    caption="Ethnologue / Badan Bahasa, angka perkiraan"
  />

  <ul class="flex flex-col">
    {#each languages as lang (lang.slug)}
      <li
        class="flex flex-col gap-1 py-3 border-b border-slate-200/60 dark:border-zinc-800 last:border-b-0"
      >
        <div class="flex items-center gap-2 flex-wrap min-w-0">
          <h3 class="font-semibold dark:text-white">{lang.name}</h3>
          <span class="text-sm italic text-slate-500 dark:text-zinc-400">
            {lang.native}
          </span>
          <span class="ml-auto shrink-0">
            <Badge color={statusColor(lang.status)}>
              {statusLabel(lang.status)}
            </Badge>
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          Penutur {lang.speakers} · {lang.region} · {lang.family} ·
          <a
            href="/c/bahasa-{lang.slug}"
            class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            /c/bahasa-{lang.slug}
          </a>
        </p>
      </li>
    {/each}
  </ul>
</div>
