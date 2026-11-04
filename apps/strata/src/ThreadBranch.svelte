<script lang="ts">
  import ThreadBranch from './ThreadBranch.svelte'
  import PostCard from './PostCard.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { ChevronDown, ChevronUp } from '@lucide/svelte'
  import type { ReplyNode } from './thread'
  import type { Post, Community } from './api'
  let {
    node,
    depth = 0,
    community,
    loggedIn,
    canVote,
    rootAuthor,
    onReply,
    onError,
  }: {
    node: ReplyNode
    depth?: number
    community?: Community
    loggedIn: boolean
    canVote: boolean
    rootAuthor: string
    onReply: (post: Post) => void
    onError: (message: string) => void
  } = $props()
  let collapsed = $state(false),
    expanded = $state(false)
  const visibleChildren = $derived(
    expanded ? node.children : node.children.slice(0, 1),
  )
</script>

<div class="thread-branch" class:thread-child={depth > 0} class:has-children={node.children.length > 0}>
  {#if node.missingParent}<a class="missing-parent" href={'/square/' + node.post.parent_id}>Lihat balasan sebelumnya</a>{/if}
  <PostCard post={node.post} {community} {loggedIn} {canVote} {onError} {onReply} reply authorBadge={node.post.author.id === rootAuthor} />
  {#if node.children.length}
    <div id={'branch-' + node.post.id} hidden={collapsed} class="thread-children">
      {#if !collapsed && depth < 1}
        {#each visibleChildren as child (child.post.id)}<ThreadBranch node={child} depth={depth + 1} {community} {loggedIn} {canVote} {rootAuthor} {onReply} {onError} />{/each}
      {:else if !collapsed}<a class="thread-open-branch" href={'/square/' + node.post.id}>Lanjutkan percakapan <ChevronDown size={14} /></a>{/if}
    </div>
    {#if collapsed}<Button class="thread-expand" variant="ghost" size="sm" aria-expanded="false" aria-controls={'branch-' + node.post.id} onclick={()=>collapsed=false}><ChevronDown size={14} />Tampilkan {node.children.length} balasan</Button>
    {:else if depth < 1 && !expanded && node.children.length > 1}<Button class="thread-expand" variant="ghost" size="sm" aria-expanded="false" onclick={() => expanded = true}><ChevronDown size={14} />Lihat {node.children.length - 1} balasan lain</Button>
    {:else if depth < 1 && node.children.length > 1}<Button class="thread-collapse" variant="ghost" size="sm" aria-expanded="true" aria-controls={'branch-' + node.post.id} onclick={()=>{collapsed=true;expanded=false}}><ChevronUp size={14} />Ciutkan balasan</Button>{/if}
  {/if}
</div>
