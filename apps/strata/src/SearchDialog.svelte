<script lang="ts">
  import { Command } from 'bits-ui'
  import {
    Search,
    ArrowUpRight,
    LoaderCircle,
    Users,
    MessageCircle,
    MapPin,
    Building2,
    BookOpen,
  } from '@lucide/svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { request } from './api'
  import {
    categories,
    resultGroups,
    type SearchResult,
    type SearchCategory,
  } from './search'
  let {
    open = $bindable(false),
    query = $bindable(''),
    navigate,
  }: {
    open?: boolean
    query?: string
    navigate: (href: string) => void
  } = $props()
  let category = $state<SearchCategory>('all'),
    data = $state<SearchResult | null>(null),
    pending = $state(false),
    error = $state('')
  const groups = $derived(resultGroups(data, category))
  const icons = {
    people: Users,
    posts: MessageCircle,
    communities: Users,
    contexts: MapPin,
    groups: Building2,
    wiki: BookOpen,
  }
  function go(href: string) {
    open = false
    navigate(href)
  }
  $effect(() => {
    if (!open) {
      data = null
      return
    }
    const q = query.trim(),
      controller = new AbortController()
    pending = true
    data = null
    error = ''
    const timer = setTimeout(
      async () => {
        try {
          const response = await request<SearchResult>(
            '/v1/search?q=' + encodeURIComponent(q),
            undefined,
            controller.signal,
          )
          if (!controller.signal.aborted) data = response
        } catch (e) {
          if (!controller.signal.aborted)
            error = e instanceof Error ? e.message : 'Pencarian belum tersedia'
        } finally {
          if (!controller.signal.aborted) pending = false
        }
      },
      q ? 220 : 0,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  })
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="search-dialog" showCloseButton={false}>
    <Dialog.Title class="sr-only">Cari ETNOS</Dialog.Title>
    <Dialog.Description class="sr-only">
      Cari orang, percakapan, komunitas dan wiki. Gunakan panah untuk memilih,
      Enter untuk membuka.
    </Dialog.Description>
    <Command.Root
      label="Cari ETNOS"
      class="search-command"
      shouldFilter={false}
      loop
      vimBindings={false}
    >
      <div class="command-search-input">
        <Search size={20} /><Command.Input
          bind:value={query}
          maxlength={100}
          placeholder="Cari ETNOS"
          aria-label="Cari ETNOS"
        /><Dialog.Close class="search-close" aria-label="Tutup pencarian">
          Esc
        </Dialog.Close>
      </div>
      <div class="search-filters" role="group" aria-label="Jenis hasil">
        {#each categories as [key, label]}<button
            aria-pressed={category === key}
            onclick={() => (category = key)}
          >
            {label}
          </button>{/each}
      </div>
      <Command.List class="command-results" aria-busy={pending}>
        {#if pending}<div class="search-state" role="status">
            <LoaderCircle size={18} class="animate-spin" />Mencari…
          </div>
        {:else if error}<div class="search-state" role="alert">
            {error}<Button
              variant="outline"
              onclick={() => go('/find?q=' + encodeURIComponent(query))}
            >
              Buka pencarian
            </Button>
          </div>
        {:else}
          {#if !query}<p class="search-section-label">Di ETNOS</p>{/if}
          {#each groups as group}<Command.Group value={group.key}>
              <Command.GroupHeading class="search-section-label">
                {group.label}
              </Command.GroupHeading>
              <Command.GroupItems>
                {#each group.items as item}{@const Icon =
                    icons[group.key as keyof typeof icons]}<Command.Item
                    value={group.key + ':' + item.id}
                    onSelect={() => go(item.href)}
                    class="command-result"
                  >
                    <Icon size={18} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </Command.Item>{/each}
              </Command.GroupItems>
            </Command.Group>{/each}
          {#if !groups.length}<div class="search-state">
              <strong>{query ? 'Belum ada hasil' : 'Mulai menjelajah'}</strong>
              <p>
                {query
                  ? 'Coba nama, topik, atau kata lain.'
                  : 'Temukan komunitas dan percakapan pertama.'}
              </p>
              <Button variant="outline" onclick={() => go('/explore')}>
                Jelajah
              </Button>
            </div>{/if}
        {/if}
      </Command.List>
      <div class="search-footer">
        <span>↑ ↓ Pilih · Enter Buka</span>
        <button onclick={() => go('/find?q=' + encodeURIComponent(query))}>
          Lihat semua hasil <ArrowUpRight size={14} />
        </button>
      </div>
    </Command.Root>
  </Dialog.Content>
</Dialog.Root>
