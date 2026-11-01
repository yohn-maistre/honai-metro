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
    onCompose: () => void
    onSearch: (q: string) => void
    onRefresh: () => void
    feedMode: 'new' | 'mine'
    onFeedChange: (mode: 'new' | 'mine') => void
  } = $props()
</script>

<Sidebar.Provider style="--sidebar-width: 15rem;">
  <ShellContent
    {path}
    {heading}
    {auth}
    {unread}
    {onCompose}
    {onSearch}
    {onRefresh}
    {feedMode}
    {onFeedChange}
    {rail}
  >
    {@render children()}
  </ShellContent>
</Sidebar.Provider>
