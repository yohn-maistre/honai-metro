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
</script>

<Sidebar.Provider style="--sidebar-width: 15rem;">
  <ShellContent {path} {heading} {auth} {unread} {onCompose} {onSearch} {rail}>
    {@render children()}
  </ShellContent>
</Sidebar.Provider>
