<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import {
    Home,
    Compass,
    Bell,
    MessageSquare,
    Users,
    Bookmark,
    BookOpen,
    Search,
    Settings2,
    Plus,
    Sun,
    Moon,
    PanelLeft,
    X,
    ChevronsUpDown,
    Building2,
    ListTodo,
    ArrowLeft,
  } from '@lucide/svelte'
  import { appearance } from './appearance.svelte'
  import { initials, type Auth } from './api'
  let {
    children,
    rail,
    path,
    heading,
    auth,
    unread = 0,
    onCompose,
    onSearch,
  }: {
    children: Snippet
    rail: Snippet
    path: string
    heading: string
    auth: Auth
    unread?: number
    onCompose: () => void
    onSearch: (q: string) => void
  } = $props()
  const sidebar = Sidebar.useSidebar()
  let searchOpen = $state(false)
  let query = $state(''),
    searchField = $state<HTMLInputElement | null>(null)
  const nav = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/explore', label: 'Jelajah', icon: Compass },
    { href: '/communities', label: 'Komunitas', icon: Users },
    { href: '/groups', label: 'Kelompok', icon: Building2 },
    { href: '/wiki', label: 'Wiki', icon: BookOpen },
    { href: '/work', label: 'Kerja publik', icon: ListTodo },
    { href: '/messages', label: 'Pesan', icon: MessageSquare },
    { href: '/notifications', label: 'Aktivitas', icon: Bell },
    { href: '/saved', label: 'Tersimpan', icon: Bookmark },
  ]
  function active(href: string) {
    return href === '/' ? path === '/' : path.startsWith(href)
  }
</script>

<a class="cx-skip" href="#commons-main">Lewati navigasi</a>
<Sidebar.Root>
  <Sidebar.Header class="p-5 pb-3">
    <div class="cx-between">
      <a href="/" class="cx-brand">
        etnos
        <span>.</span>
      </a>
      <Button
        variant="ghost"
        size="icon"
        class="md:hidden"
        aria-label="Tutup menu"
        onclick={() => sidebar.setOpenMobile(false)}
      >
        <X size={19} />
      </Button>
    </div>
    <Dropdown.Root>
      <Dropdown.Trigger class="workspace-picker">
        <span class="workspace-mark"><Compass size={16} /></span>
        <span>Semua wilayah</span>
        <ChevronsUpDown size={14} />
      </Dropdown.Trigger>
      <Dropdown.Content align="start" class="w-56">
        <Dropdown.Label>Jelajahi konteks</Dropdown.Label><Dropdown.Item
          onSelect={() => {
            sidebar.setOpenMobile(false)
            document.querySelector<HTMLAnchorElement>('.cx-brand')?.click()
          }}
        >
          Semua wilayah
        </Dropdown.Item><Dropdown.Item>
          {#snippet child({ props })}<a
              {...props}
              href="/explore"
              onclick={() => sidebar.setOpenMobile(false)}
            >
              Wilayah, tempat & topik
            </a>{/snippet}
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.Menu>
        {#each nav as item}<Sidebar.MenuItem>
            <Sidebar.MenuButton
              isActive={active(item.href)}
              onclick={() => sidebar.setOpenMobile(false)}
              class="nav-link"
            >
              {#snippet child({ props })}<a
                  {...props}
                  href={item.href}
                  aria-current={active(item.href) ? 'page' : undefined}
                >
                  <item.icon size={20} strokeWidth={1.7} />
                  <span>{item.label}</span>
                </a>{/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>{/each}
      </Sidebar.Menu>
    </Sidebar.Group>
    <div class="px-4 pt-2">
      <Button class="w-full" onclick={onCompose}>
        <Plus size={18} />Posting
      </Button>
    </div>
  </Sidebar.Content>
  <Sidebar.Footer class="p-4 gap-3">
    <Button href="/preferences" variant="ghost" class="justify-start">
      <Settings2 size={18} />Pengaturan
    </Button>
    {#if auth.actor}<a
        href={'/people/' + auth.actor.id}
        class="account-link"
        onclick={() => sidebar.setOpenMobile(false)}
      >
        <Avatar.Root>
          <Avatar.Fallback>{initials(auth.actor.name)}</Avatar.Fallback>
        </Avatar.Root>
        <span>
          <strong>{auth.actor.name}</strong>
          <small>Akun AT terhubung</small>
        </span>
      </a>{:else}<Button
        href="/login"
        variant="outline"
        onclick={() => sidebar.setOpenMobile(false)}
      >
        Masuk
      </Button>{/if}
    <span class="preview-label">
      <span></span>
      Pratinjau terhubung
    </span>
  </Sidebar.Footer>
</Sidebar.Root>
<Sidebar.Inset class="platform-inset">
  <header class="cx-topbar" class:thread-topbar={path.startsWith('/square/')}>
    {#if path.startsWith('/square/')}<Button
        href="/"
        variant="ghost"
        size="icon"
        class="thread-back"
        aria-label="Kembali ke beranda"
      >
        <ArrowLeft size={22} />
      </Button>
      <span class="thread-heading">Percakapan</span>{/if}
    <Button
      variant="ghost"
      size="icon"
      aria-label="Semua ruang"
      onclick={() => sidebar.toggle()}
    >
      <PanelLeft size={19} />
    </Button>
    <Breadcrumb.Root class="top-breadcrumb">
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">ETNOS</Breadcrumb.Link>
        </Breadcrumb.Item><Breadcrumb.Separator /><Breadcrumb.Item>
          <Breadcrumb.Page>{heading}</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
    <a href="/" class="cx-mobile-brand">
      etnos
      <span>.</span>
    </a>
    <form
      class="cx-global-search"
      class:search-open={searchOpen}
      onfocusout={(e) => {
        if (
          !(e.relatedTarget instanceof Node) ||
          !e.currentTarget.contains(e.relatedTarget)
        )
          searchOpen = false
      }}
      onsubmit={(e) => {
        e.preventDefault()
        onSearch(query)
      }}
    >
      <Search size={17} class="desktop-search-icon" /><Button
        variant="ghost"
        size="icon"
        class="mobile-search-button"
        aria-label="Buka pencarian"
        onclick={async () => {
          searchOpen = true
          await tick()
          searchField?.focus()
        }}
      >
        <Search size={18} />
      </Button><Input
        bind:ref={searchField}
        onfocus={() => (searchOpen = true)}
        bind:value={query}
        placeholder="Cari percakapan"
        aria-label="Cari percakapan"
        class="border-0 shadow-none focus-visible:ring-0 bg-transparent"
      />
    </form>
    <Button
      href="/notifications"
      variant="ghost"
      size="icon"
      class="activity-bell"
      aria-label={unread ? `Aktivitas, ${unread} belum dibaca` : 'Aktivitas'}
    >
      <Bell size={18} />{#if unread}<span class="bell-dot"></span>{/if}
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="theme-toggle"
      aria-label={appearance.theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
      onclick={() =>
        (appearance.theme = appearance.theme === 'dark' ? 'light' : 'dark')}
    >
      {#if appearance.theme === 'dark'}<Sun size={18} />{:else}<Moon
          size={18}
        />{/if}
    </Button>
  </header>
  <div class="cx-content-grid">
    <main id="commons-main" class="cx-main" tabindex="-1">
      {@render children()}
    </main>
    <aside class="cx-context" aria-label="Konteks terkait">
      {@render rail()}
    </aside>
  </div>
</Sidebar.Inset>
<nav
  class="cx-mobile-dock"
  class:thread-dock={path.startsWith('/square/')}
  aria-label="Navigasi seluler"
>
  <Button
    href="/"
    variant="ghost"
    size="icon"
    aria-label="Beranda"
    aria-current={active('/') ? 'page' : undefined}
  >
    <Home size={21} />
  </Button>
  <Button href="/explore" variant="ghost" size="icon" aria-label="Jelajah">
    <Compass size={21} />
  </Button>
  <Button size="icon" aria-label="Posting baru" onclick={onCompose}>
    <Plus size={23} />
  </Button>
  <Button href="/wiki" variant="ghost" size="icon" aria-label="Wiki">
    <BookOpen size={21} />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    aria-label="Semua ruang"
    onclick={() => sidebar.setOpenMobile(true)}
  >
    <PanelLeft size={21} />
  </Button>
</nav>
