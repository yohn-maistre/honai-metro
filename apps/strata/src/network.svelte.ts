import { untrack } from 'svelte'
/** Per-browser request lifecycle. Never make a calling effect depend on this counter. */
export const network = $state({ pending: 0, started: 0, settled: 0 })
export function beginRequest() {
  untrack(() => {
    network.pending++
    network.started++
  })
  let done = false
  return () =>
    untrack(() => {
      if (done) return
      done = true
      network.pending--
      network.settled++
    })
}
