<script lang="ts">
  import { FileText, ListTodo, ArrowUpRight } from '@lucide/svelte'
  import { request } from './api'
  let { postId }: { postId: string } = $props()
  let works = $state<
    {
      id: string
      title: string
      origin_post_id: string | null
      state: string
      result: { text: string } | null
      sponsor: { title: string }
    }[]
  >([])
  const states: Record<string, string> = {
    proposed: 'Direncanakan',
    adopted: 'Diadopsi',
    active: 'Berjalan',
    blocked: 'Terhambat',
    completed: 'Selesai',
    withdrawn: 'Ditarik',
  }
  $effect(() => {
    const id = postId,
      abort = new AbortController()
    works = []
    request<typeof works>('/v1/work', undefined, abort.signal)
      .then((rows) => {
        if (!abort.signal.aborted)
          works = rows.filter((w) => w.origin_post_id === id)
      })
      .catch(() => {})
    return () => abort.abort()
  })
</script>

{#if works.length}<details class="thread-work">
    <summary>
      <ListTodo size={15} />Karya & tindak lanjut
    </summary>
    <div>
      {#each works as work}<a
          class="thread-work-card"
          href={'/work/' + work.id}
        >
          <FileText size={18} />
          <div>
            <strong>{work.title}</strong>
            <small>
              {work.sponsor.title} · {states[work.state] ?? work.state}
            </small>
            {#if work.result}<p>{work.result.text.slice(0, 180)}</p>{/if}
          </div>
          <ArrowUpRight size={15} />
        </a>{/each}
    </div>
  </details>{/if}
