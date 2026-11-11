<script lang="ts">
  import {avatarTone} from './avatar-tone'
  import { type Snippet } from 'svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    Home,
    Compass,
    Bell,
    MessagesSquare,
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
    ListTodo,
    ArrowLeft,
    ChevronDown,
    RefreshCw,
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
  } = $props()
  const sidebar = Sidebar.useSidebar()
  const nav = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/explore', label: 'Jelajah', icon: Compass },
    { href: '/communities', label: 'Komunitas', icon: Users },
    { href: '/wiki', label: 'Wiki', icon: BookOpen },
    { href: '/work', label: 'Kerja publik', icon: ListTodo },
    { href: '/messages', label: 'Pesan', icon: MessagesSquare },
    { href: '/notifications', label: 'Aktivitas', icon: Bell },
    { href: '/saved', label: 'Tersimpan', icon: Bookmark },
  ]
  function active(href: string) {
    return href === '/'
      ? path === '/'
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
  </Sidebar.Header>
  <Sidebar.Content>
    {#each [nav.slice(0, 5), nav.slice(5)] as items, section}
      <Sidebar.Group>
        <Sidebar.Menu>
          {#each items as item}<Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={active(item.href)}
                onclick={() => sidebar.setOpenMobile(false)}
                class="nav-link"
              >
                {#snippet child({ props })}<a
                    {...props}
                    href={item.href}
                    aria-label={item.href === '/notifications' && unread ? `${item.label}, ${unread} belum dibaca` : item.label}
                    title={item.label}
                    aria-current={active(item.href) ? 'page' : undefined}
                  >
                    <item.icon size={20} strokeWidth={1.7} />
                    <span>{item.label}</span>
                    {#if item.href === '/notifications' && unread}<span
                        class="utility-unread notification-count" aria-hidden="true"
                      >
                        {unread>99?'99+':unread}
                      </span>{/if}
                  </a>{/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>{/each}
        </Sidebar.Menu>
      </Sidebar.Group>{#if section === 0}
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
      {/if}{/each}
  </Sidebar.Content>
  <Sidebar.Footer class="p-4 gap-3">
    {#if auth.actor}<a href="/studio" class="preview-label sidebar-studio" onclick={() => sidebar.setOpenMobile(false)}>Studio komunitas</a>{/if}
    <Button
      href="/preferences"
      variant="ghost"
      class="sidebar-settings"
      aria-label="Pengaturan"
      title="Pengaturan"
      onclick={() => sidebar.setOpenMobile(false)}
    >
      <Settings2 size={18} />
      <span>Pengaturan</span>
    </Button>
    {#if auth.actor}<a
        href={'/people/' + auth.actor.id}
        class="account-link"
        aria-label={'Profil ' + auth.actor.name}
        title={'Profil ' + auth.actor.name}
        onclick={() => sidebar.setOpenMobile(false)}
      >
        <Avatar.Root>
          <Avatar.Fallback class="avatar-tinted" style={avatarTone(auth.actor.id)}>{initials(auth.actor.name)}</Avatar.Fallback>
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
    <a
      href="/agents"
      class="preview-label"
      onclick={() => sidebar.setOpenMobile(false)}
    >
      Agen & koneksi
    </a>
    <span class="preview-label">ETNOS · Alpha</span>
  </Sidebar.Footer>
</Sidebar.Root>
<Sidebar.Inset class="platform-inset">
  <header
    class="cx-topbar"
    class:home-topbar={path === '/'}
    class:directory-topbar={['/communities', '/groups', '/contexts','/topics'].includes(
      path,
    )}
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
      {#if path === '/'}<Dropdown.Root>
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
        </Dropdown.Root>{:else if path === '/explore' || ['/communities', '/groups', '/contexts','/topics'].includes(path)}<h1
        >
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
      <Bell size={18} />{#if unread}<span class="notification-count" aria-hidden="true">{unread>99?'99+':unread}</span>{/if}
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="theme-toggle"
      title={appearance.themeMode === 'clock'
        ? 'Tema otomatis · ubah tema'
        : 'Ubah tema'}
      aria-label={appearance.theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
      onclick={() =>
        (appearance.themeMode = appearance.theme === 'dark' ? 'light' : 'dark')}
    >
      {#if appearance.theme === 'dark'}<Sun size={18} />{:else}<Moon
          size={18}
        />{/if}
    </Button>
  </header>
  <div
    class="cx-content-grid"
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
      hidden={[
        'preferences',
        'messages',
        'agents',
        'studio',
        'login',
        'recover-messages',
      ].includes(path.split('/')[1])}
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
    <span aria-hidden="true">Beranda</span>
  </Button>
  <Button href="/explore" variant="ghost" size="icon" aria-label="Jelajah">
    <Compass size={21} />
    <span aria-hidden="true">Jelajah</span>
  </Button>
  <Button size="icon" aria-label="Posting baru" onclick={onCompose}>
    <Plus size={23} />
    <span aria-hidden="true">Posting</span>
  </Button>
  <Button
    href="/notifications"
    variant="ghost"
    size="icon"
    aria-label={unread ? `Aktivitas, ${unread} belum dibaca` : 'Aktivitas'}
    aria-current={active('/notifications') ? 'page' : undefined}
    class="mobile-activity"
  >
    <Bell size={21} />
    <span aria-hidden="true">Aktivitas</span>
    {#if unread}<span class="notification-count" aria-hidden="true">{unread>99?'99+':unread}</span>{/if}
  </Button>
  <Button
    variant="ghost"
    size="icon"
    aria-label="Buka menu"
    title="Menu"
    onclick={() => sidebar.toggle()}
  >
    <Menu size={21} />
    <span aria-hidden="true">Menu</span>
  </Button>
</nav>
