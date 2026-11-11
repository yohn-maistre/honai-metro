<script lang="ts">
  import { notify } from './notifications.svelte'
  import { request } from './api'
  import Choice from './Choice.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  let { communityId }: { communityId: string } = $props()
  let contributor = $state(''),
    reviewer = $state(''),
    groups = $state<{ id: string; title: string }[]>([]),
    busy = $state(false),
    message = $state(''),
    ready = $state(false)
  $effect(() => {
    const id = communityId,
      abort = new AbortController()
    ready = false
    Promise.all([
      request<{
        contributor_group_id: string | null
        reviewer_group_id: string | null
      }>('/v1/communities/' + id + '/wiki-policy', undefined, abort.signal),
      request<{ id: string; title: string }[]>(
        '/v1/groups',
        undefined,
        abort.signal,
      ),
      request<{ group_id: string; role: string }[]>(
        '/v1/group-memberships',
        undefined,
        abort.signal,
      ),
    ])
      .then(([policy, rows, roles]) => {
        if (abort.signal.aborted) return
        contributor = policy.contributor_group_id ?? ''
        reviewer = policy.reviewer_group_id ?? ''
        groups = rows.filter((g) =>
          roles.some((r) => r.group_id === g.id && r.role !== 'member'),
        )
        ready = true
      })
      .catch((e) => {
        if (!abort.signal.aborted) message = e.message
      })
    return () => abort.abort()
  })
  async function save() {
    busy = true
    message = ''
    try {
      await request('/v1/communities/' + communityId + '/wiki-policy', {
        contributorGroupId: contributor || null,
        reviewerGroupId: reviewer || null,
      })
      notify('Aturan disimpan.')
    } catch (e) {
      message = e instanceof Error ? e.message : 'Belum tersimpan.'
    } finally {
      busy = false
    }
  }
</script>

<details class="wiki-policy">
  <summary>Aturan kontribusi & tinjauan</summary>
  {#if ready}<p>
      Keanggotaan komunitas tetap diperlukan. Kelompok tambahan dapat membatasi
      pengusul dan peninjau.
    </p>
    <label>
      Kelompok pengusul<Choice
        bind:value={contributor}
        items={[
          { value: '', label: 'Semua anggota komunitas' },
          ...groups.map((g) => ({ value: g.id, label: g.title })),
        ]}
      />
    </label>
    <label>
      Kelompok peninjau<Choice
        bind:value={reviewer}
        items={[
          { value: '', label: 'Pengelola komunitas' },
          ...groups.map((g) => ({ value: g.id, label: g.title })),
        ]}
      />
    </label>
    <Button variant="outline" disabled={busy} onclick={save}>
      Simpan aturan
    </Button>{/if}{#if message}<p role="alert">{message}</p>{/if}
</details>
