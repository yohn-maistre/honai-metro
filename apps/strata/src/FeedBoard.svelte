<script lang="ts">
  import { onMount } from 'svelte'
  import { Plus, Columns3 } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import FeedColumn from './FeedColumn.svelte'
  import { request, type Auth, type Community, type Membership } from './api'
  let {
    auth,
    communities,
    memberships,
    onError,
    initialColumns = 2,
  }: {
    auth: Auth
    communities: Community[]
    memberships: Membership[]
    onError: (s: string) => void
    initialColumns?: number
  } = $props()
  let columns = $state([
      { id: 1, source: 'all' },
      { id: 2, source: 'all' },
    ]),
    active = $state(1),
    wide = $state(false),
    contexts = $state<{ id: string; title: string }[]>([]),
    nextId = 3
  const choices = $derived([
    { value: 'all', label: 'Terbaru' },
    ...(auth.actor ? [{ value: 'following', label: 'Mengikuti' }] : []),
    ...communities
      .filter(
        (c) =>
          c.visibility === 'public' ||
          memberships.some((m) => m.community_id === c.id),
      )
      .map((c) => ({ value: c.id, label: c.title })),
    ...contexts.map((c) => ({ value: 'context:' + c.id, label: c.title })),
  ])
  onMount(() => {
    if (initialColumns === 3)
      columns = [
        ...columns,
        { id: nextId++, source: auth.actor ? 'following' : 'all' },
      ]
    const media = window.matchMedia('(min-width: 1000px)'),
      update = () => (wide = media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  })
  $effect(() => {
    const actor = auth.actor?.id,
      controller = new AbortController()
    contexts = []
    void request<{ id: string; title: string }[]>(
      '/v1/contexts',
      undefined,
      controller.signal,
    )
      .then((rows) => {
        if (!controller.signal.aborted && actor === auth.actor?.id)
          contexts = rows
      })
      .catch(() => {})
    return () => controller.abort()
  })
  // Choose a useful second lane once membership is loaded; no saved private identifiers.
  let initialized = false
  $effect(() => {
    if (!initialized && communities.length) {
      columns[1].source = communities[0].id
      initialized = true
    }
  })
  function remove(id: number) {
    columns = columns.filter((c) => c.id !== id)
    if (active === id) active = columns[0].id
  }
</script>

<div class="board-toolbar">
  <div>
    <Columns3 size={18} />
    <span>Percakapan berdampingan</span>
  </div>
  <Button
    variant="outline"
    size="sm"
    disabled={columns.length === 3}
    onclick={() => {
      const id = nextId++
      columns = [...columns, { id, source: auth.actor ? 'following' : 'all' }]
      active = id
    }}
  >
    <Plus size={15} />Lajur
  </Button>
</div>
<div class="board-mobile-tabs" role="group" aria-label="Pilih lajur">
  {#each columns as column}<button
      aria-pressed={active === column.id}
      onclick={() => (active = column.id)}
    >
      {choices.find((c) => c.value === column.source)?.label ?? 'Terbaru'}
    </button>{/each}
</div>
<div class="feed-board" style:--columns={columns.length}>
  {#each columns as column (column.id)}<div
      class="board-lane"
      class:active={active === column.id}
    >
      <FeedColumn
        source={column.source}
        {choices}
        {auth}
        {communities}
        {memberships}
        {onError}
        enabled={wide || active === column.id}
        onChange={(value) => (column.source = value)}
        onRemove={columns.length > 1 ? () => remove(column.id) : undefined}
      />
    </div>{/each}
</div>
