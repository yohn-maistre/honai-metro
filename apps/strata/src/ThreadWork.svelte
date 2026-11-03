<script lang="ts">
  import {
    FileText,
    ListTodo,
    ArrowUpRight,
    GitPullRequest,
  } from '@lucide/svelte'
  import DecisionSuggestions from './DecisionSuggestions.svelte'
  import { request } from './api'
  import { Button } from '$lib/components/ui/button/index.js'
  let { postId, onDraft }: { postId: string; onDraft?: () => void } = $props()
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

{#if works.length || onDraft}<details class="thread-work">
    <summary>
      <ListTodo size={15} />{works.length
        ? 'Karya & tindak lanjut'
        : 'Jadikan pengetahuan bersama'}
    </summary>
    <div>
      {#if onDraft}<DecisionSuggestions {postId} {onDraft}/>{/if}
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
        </a>{/each}{#if onDraft}<Button variant="ghost" onclick={onDraft}>
          <GitPullRequest size={15} />Mulai draf wiki dari percakapan
        </Button>{/if}
    </div>
  </details>{/if}
