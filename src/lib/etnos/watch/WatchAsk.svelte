<script lang="ts">
  interface Source {
    kind?: string
    title?: string
    url?: string
    publisher?: string
  }
  interface Message {
    role: 'user' | 'assistant'
    content: string
  }
  interface Props {
    pageTitle?: string
  }

  let { pageTitle = '' }: Props = $props()
  let query = $state('')
  let loading = $state(false)
  let error = $state('')
  let answer = $state('')
  let sources = $state<Source[]>([])
  let history = $state<Message[]>([])

  async function ask() {
    const q = query.trim()
    if (q.length < 2 || loading) return
    loading = true
    error = ''
    answer = ''
    sources = []
    try {
      const response = await fetch('/api/etnos/watch/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: q,
          locale: 'id',
          pageTitle,
          history: history.slice(-6),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Ask Watch tidak tersedia.')
      answer = String(body?.answer || '')
      sources = Array.isArray(body?.sources) ? body.sources : []
      history = [...history, { role: 'user', content: q }, { role: 'assistant', content: answer }].slice(-8)
      query = ''
    } catch (e) {
      error = e instanceof Error ? e.message : 'Ask Watch tidak tersedia.'
    } finally {
      loading = false
    }
  }
</script>

<section class="ask-watch">
  <div class="ask-head">
    <span>Ask Watch</span>
    <p>Tanya indeks bukti Watch, bukan web umum.</p>
  </div>
  <form onsubmit={(e) => { e.preventDefault(); void ask() }}>
    <input bind:value={query} placeholder="Apa yang berubah? Sumber mana yang membahas ini?" maxlength="500" />
    <button type="submit" disabled={loading || query.trim().length < 2}>{loading ? 'Mencari…' : 'Tanya'}</button>
  </form>

  {#if error}<p class="ask-error">{error}</p>{/if}
  {#if answer}
    <div class="ask-answer">
      <p>{answer}</p>
      {#if sources.length}
        <div class="ask-sources">
          {#each sources as source, i}
            <a href={source.url} target={source.url?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              <span>S{i + 1}</span>
              <strong>{source.title || source.publisher || 'Sumber'}</strong>
              <small>{source.publisher || source.kind}</small>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .ask-watch { margin: 18px 0 6px; border-block: 1px solid var(--etnos-line); padding: 16px 0; }
  .ask-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
  .ask-head span { font-size: .6rem; font-weight: 720; letter-spacing: .14em; text-transform: uppercase; color: var(--etnos-accent); }
  .ask-head p { margin: 0; color: var(--etnos-muted); font-size: .67rem; }
  form { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
  input { min-height: 44px; border: 1px solid var(--etnos-line); border-radius: 10px; background: var(--etnos-panel); color: var(--etnos-ink); padding: 10px 12px; outline: none; }
  input:focus { border-color: var(--etnos-line-strong); box-shadow: 0 0 0 2px color-mix(in srgb, var(--etnos-accent) 22%, transparent); }
  button { min-height: 44px; border: 0; border-radius: 10px; padding: 0 14px; background: #eef0ff; color: #121421; font-weight: 680; }
  button:disabled { opacity: .45; cursor: default; }
  .ask-error { margin: 10px 0 0; color: #ef8e8e; font-size: .72rem; }
  .ask-answer { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--etnos-line); }
  .ask-answer > p { margin: 0; white-space: pre-wrap; color: var(--etnos-ink-soft); font-size: .9rem; line-height: 1.65; }
  .ask-sources { margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 7px; }
  .ask-sources a { display: grid; grid-template-columns: 26px 1fr; gap: 2px 7px; padding: 9px; border: 1px solid var(--etnos-line); border-radius: 9px; color: var(--etnos-ink); text-decoration: none; }
  .ask-sources a:hover { border-color: var(--etnos-line-strong); background: color-mix(in srgb,var(--etnos-ink) 3%,transparent); }
  .ask-sources span { grid-row: 1 / span 2; width: 25px; height: 25px; display: grid; place-items: center; border-radius: 7px; background: var(--etnos-panel-2); color: var(--etnos-accent); font-size: .57rem; font-weight: 700; }
  .ask-sources strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .68rem; font-weight: 600; }
  .ask-sources small { color: var(--etnos-muted); font-size: .58rem; }
  @media (max-width: 560px) { form { grid-template-columns: 1fr; } button { justify-self: end; min-width: 90px; } .ask-head { display: block; } .ask-head p { margin-top: 4px; } }
</style>
