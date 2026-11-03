<script lang="ts">
  import { type Snippet } from 'svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
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
    Menu,
    X,
    ChevronsUpDown,
    ListTodo,
    ArrowLeft,
    ChevronDown,
    RefreshCw,
    Columns3,
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
    onBack,
    onCompose,
    onSearch,
    onRefresh,
    feedMode,
    onFeedChange,
    layout = 'single',
    onLayoutChange,
  }: {
    children: Snippet
    rail: Snippet
    path: string
    heading: string
    auth: Auth
    unread?: number
    onBack: () => void
    onCompose: () => void
    onSearch: (q: string) => void
    onRefresh: () => void
    feedMode: 'new' | 'mine' | 'following'
    onFeedChange: (mode: 'new' | 'mine' | 'following') => void
    layout?: string
    onLayoutChange: (value: string) => void
  } = $props()
  const sidebar = Sidebar.useSidebar()
  const nav = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/explore', label: 'Jelajah', icon: Compass },
    { href: '/communities', label: 'Komunitas', icon: Users },
    { href: '/wiki', label: 'Wiki', icon: BookOpen },
    { href: '/messages', label: 'Pesan', icon: MessageSquare },
    { href: '/notifications', label: 'Aktivitas', icon: Bell },
    { href: '/saved', label: 'Tersimpan', icon: Bookmark },
    { href: '/work', label: 'Kerja publik', icon: ListTodo },
    { href: '/preferences', label: 'Pengaturan', icon: Settings2 },
  ]
  function active(href: string) {
    return href === '/'
      ? path === '/' || path === '/board'
      : href === '/communities'
        ? path.startsWith('/communities') || path.startsWith('/groups')
        : path.startsWith(href)
  }
  $effect(() => {
    void path
    sidebar.setOpenMobile(false)
  })
  function compose() {
    sidebar.setOpenMobile(false)
    onCompose()
  }
</script>

<a class="cx-skip" href="#commons-main">Lewati navigasi</a>
<Sidebar.Root class="etnos-sidebar">
  <Sidebar.Header class="p-5 pb-3">
    <div class="cx-between">
      <a href="/" class="cx-brand" onclick={() => sidebar.setOpenMobile(false)}>
        <span class="brand-full">etnos</span>
        <span class="brand-compact" aria-hidden="true">e</span>
        <span class="brand-dot">.</span>
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
      <Dropdown.Trigger
        class="workspace-picker"
        aria-label="Jelajahi wilayah"
        title="Jelajahi wilayah"
      >
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
                  aria-label={item.label}
                  title={item.label}
                  aria-current={active(item.href) ? 'page' : undefined}
                >
                  <item.icon size={20} strokeWidth={1.7} />
                  <span>{item.label}</span>
                  {#if item.href === '/notifications' && unread}<span
                      class="utility-unread"
                    >
                      {unread}
                    </span>{/if}
                </a>{/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>{/each}
      </Sidebar.Menu>
    </Sidebar.Group>
    <div class="px-4 pt-2">
      <Button
        class="w-full sidebar-compose"
        aria-label="Posting"
        title="Posting"
        onclick={compose}
      >
        <Plus size={18} />
        <span>Posting</span>
      </Button>
    </div>
  </Sidebar.Content>
  <Sidebar.Footer class="p-4 gap-3">
    {#if auth.actor}<a
        href={'/people/' + auth.actor.id}
        class="account-link"
        aria-label={'Profil ' + auth.actor.name}
        title={'Profil ' + auth.actor.name}
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
    <span class="preview-label">ETNOS · Alpha</span>
  </Sidebar.Footer>
</Sidebar.Root>
<Sidebar.Inset
  class={'platform-inset' +
    (path === '/board' || (path === '/' && layout !== 'single')
      ? ' workspace-view'
      : '')}
>
  <header
    class="cx-topbar"
    class:home-topbar={path === '/'}
    class:sidebar-collapsed={sidebar.state === 'collapsed'}
    class:thread-topbar={/^\/(square|people|news|communities|wiki|contexts|groups|work)\/[^/]+/.test(
      path,
    )}
  >
    {#if /^\/(square|people|news|communities|wiki|contexts|groups|work)\/[^/]+/.test(path)}<Button
        onclick={onBack}
        variant="ghost"
        size="icon"
        class="thread-back"
        aria-label="Kembali"
      >
        <ArrowLeft size={22} />
      </Button>
    {/if}
    <Button
      variant="ghost"
      size="icon"
      class="desktop-menu-toggle"
      aria-label="Semua ruang"
      onclick={() => sidebar.toggle()}
    >
      <PanelLeft size={19} />
    </Button>
    <div class="surface-heading" class:explore-title={path === '/explore'}>
      {#if path === '/' && layout === 'single'}<Dropdown.Root>
          <Dropdown.Trigger class="surface-switch" aria-label="Pilih linimasa">
            {feedMode === 'mine'
              ? 'Komunitasku'
              : feedMode === 'following'
                ? 'Mengikuti'
                : 'Terbaru'}<ChevronDown size={14} />
          </Dropdown.Trigger><Dropdown.Content align="center">
            <Dropdown.Item onSelect={() => onFeedChange('new')}>
              Terbaru
            </Dropdown.Item><Dropdown.Item
              onSelect={() => onFeedChange('mine')}
            >
              Komunitasku
            </Dropdown.Item><Dropdown.Item
              onSelect={() => onFeedChange('following')}
            >
              Mengikuti
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>{:else if path === '/'}<span>
          Beranda
        </span>{:else if path === '/explore'}<h1>
          {heading}
        </h1>{:else}<span>{heading}</span>{/if}
    </div>
    <a
      href="/"
      class="cx-mobile-brand"
      class:explore-brand={path === '/explore'}
    >
      etnos
      <span>.</span>
    </a>
    <Button
      variant="ghost"
      class="cx-global-search search-launcher"
      aria-label="Buka pencarian"
      onclick={() => onSearch('')}
    >
      <Search size={18} />
      <span>Cari ETNOS</span>
      <kbd>⌘ K</kbd>
    </Button>
    {#if path === '/'}<Button
        variant="ghost"
        size="icon"
        class="header-refresh"
        aria-label="Muat ulang"
        onclick={onRefresh}
      >
        <RefreshCw size={18} />
      </Button>{/if}
    <Button
      href="/notifications"
      variant="ghost"
      size="icon"
      class="activity-bell"
      aria-label={unread ? `Aktivitas, ${unread} belum dibaca` : 'Aktivitas'}
    >
      <Bell size={18} />{#if unread}<span class="bell-dot"></span>{/if}
    </Button>
    {#if path === '/' || path === '/board'}<Dropdown.Root>
        <Dropdown.Trigger
          class="home-layout-switch"
          aria-label="Tata letak beranda"
          title="Tata letak beranda"
        >
          <Columns3 size={19} />
        </Dropdown.Trigger><Dropdown.Content align="end">
          <Dropdown.Label>
            Tata letak
          </Dropdown.Label>{#each [['single', 'Satu linimasa'], ['split', 'Dua lajur'], ['columns', 'Tiga lajur']] as [value, label]}<Dropdown.Item
              onSelect={() => onLayoutChange(value)}
            >
              {label}{#if layout === value}
                ·{/if}
            </Dropdown.Item>{/each}
        </Dropdown.Content>
      </Dropdown.Root>{/if}
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
  <div
    class="cx-content-grid"
    class:board-grid={path === '/board' ||
      (path === '/' && layout !== 'single')}
    data-surface={path.startsWith('/square/')
      ? 'thread'
      : path === '/'
        ? 'feed'
        : 'page'}
  >
    <main id="commons-main" class="cx-main" data-route={path} tabindex="-1">
      {@render children()}
    </main>
    <aside
      class="cx-context"
      aria-label="Konteks terkait"
      hidden={path === '/board' || (path === '/' && layout !== 'single')}
    >
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
  <Button
    href="/notifications"
    variant="ghost"
    size="icon"
    aria-label={unread ? `Aktivitas, ${unread} belum dibaca` : 'Aktivitas'}
    aria-current={active('/notifications') ? 'page' : undefined}
    class="mobile-activity"
  >
    <Bell size={21} />{#if unread}<span class="bell-dot"></span>{/if}
  </Button>
  <Button
    variant="ghost"
    size="icon"
    aria-label="Buka menu"
    title="Menu"
    onclick={() => sidebar.toggle()}
  >
    <Menu size={21} />
  </Button>
</nav>
