<script lang="ts">
  import type { Snippet } from 'svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import ShellContent from './ShellContent.svelte'
  import type { Auth } from './api'
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
</script>

<Sidebar.Provider style="--sidebar-width: 15rem;">
  <ShellContent
    {path}
    {heading}
    {auth}
    {unread}
    {onBack}
    {onCompose}
    {onSearch}
    {onRefresh}
    {feedMode}
    {onFeedChange}
    {layout}
    {onLayoutChange}
    {rail}
  >
    {@render children()}
  </ShellContent>
</Sidebar.Provider>
