<script lang="ts">
  import { goto } from '$app/navigation'
  import * as Command from '$lib/components/ui/command/index.js'
  import {
    BookOpen,
    Compass,
    FileSearch,
    Home,
    Layers3,
    MessagesSquare,
    Plus,
    Radar,
    Search,
    Users,
    Workflow,
  } from '@lucide/svelte'

  interface Props {
    open?: boolean
  }

  let { open = $bindable(false) }: Props = $props()
  let query = $state('')

  function nav(href: string) {
    open = false
    query = ''
    void goto(href)
  }

  function search() {
    const q = query.trim()
    if (q.length < 2) return
    nav(`/search?q=${encodeURIComponent(q)}`)
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      open = !open
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog
  bind:open
  title="Cari ETNOS"
  description="Cari orang, komunitas, diskusi, pengetahuan, dan pantauan."
  class="etnos-command-dialog"
>
  <Command.Input
    bind:value={query}
    placeholder="Cari ETNOS…"
    onkeydown={(e) => {
      if (e.key === 'Enter' && query.trim().length > 1) {
        e.preventDefault()
        search()
      }
    }}
  />
  <Command.List>
    <Command.Empty>Tidak ada pintasan yang cocok. Tekan Enter untuk mencari.</Command.Empty>

    {#if query.trim().length > 1}
      <Command.Group heading="Cari">
        <Command.Item value={`search-${query}`} onSelect={search}>
          <Search />
          <span>Cari “{query.trim()}” di ETNOS</span>
        </Command.Item>
      </Command.Group>
      <Command.Separator />
    {/if}

    <Command.Group heading="Pergi ke">
      <Command.Item value="home beranda" onSelect={() => nav('/')}>
        <Home /><span>Beranda</span><Command.Shortcut>G H</Command.Shortcut>
      </Command.Item>
      <Command.Item value="explore jelajah" onSelect={() => nav('/explore')}>
        <Compass /><span>Jelajah</span><Command.Shortcut>G E</Command.Shortcut>
      </Command.Item>
      <Command.Item value="communities komunitas" onSelect={() => nav('/explore/communities')}>
        <Users /><span>Komunitas</span>
      </Command.Item>
      <Command.Item value="watch pantauan news evidence" onSelect={() => nav('/explore/watch')}>
        <Radar /><span>Pantauan</span>
      </Command.Item>
      <Command.Item value="wiki pengetahuan knowledge" onSelect={() => nav('/wiki')}>
        <BookOpen /><span>Pengetahuan</span>
      </Command.Item>
      <Command.Item value="public work kerja koordinasi" onSelect={() => nav('/work')}>
        <Workflow /><span>Kerja publik</span>
      </Command.Item>
    </Command.Group>

    <Command.Separator />
    <Command.Group heading="Ruang saya">
      <Command.Item value="feeds ruang saya" onSelect={() => nav('/explore/feeds')}>
        <Layers3 /><span>Feed</span>
      </Command.Item>
      <Command.Item value="inbox activity pesan" onSelect={() => nav('/inbox')}>
        <MessagesSquare /><span>Aktivitas & pesan</span>
      </Command.Item>
      <Command.Item value="create buat post discussion" onSelect={() => nav('/create')}>
        <Plus /><span>Buat sesuatu</span>
      </Command.Item>
      <Command.Item value="advanced search pencarian" onSelect={() => nav('/search')}>
        <FileSearch /><span>Pencarian lanjutan</span>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>

<style>
  :global(.etnos-command-dialog) {
    width: min(680px, calc(100vw - 28px)) !important;
    border-color: var(--etnos-line-strong, var(--border)) !important;
    background: color-mix(in srgb, var(--etnos-panel, var(--popover)) 94%, transparent) !important;
    box-shadow: 0 32px 100px rgba(0, 0, 0, 0.42) !important;
    backdrop-filter: blur(24px) saturate(125%);
    font-family: 'Instrument Sans Variable', 'Instrument Sans', Inter, system-ui, sans-serif;
  }
  :global(.etnos-command-dialog [data-command-input]) {
    min-height: 56px;
    font-size: 1rem;
  }
  :global(.etnos-command-dialog [data-command-group-heading]) {
    letter-spacing: .12em;
    text-transform: uppercase;
    font-size: .58rem;
  }
  :global(.etnos-command-dialog [data-command-item]) {
    min-height: 44px;
    border-radius: 9px;
  }
</style>
