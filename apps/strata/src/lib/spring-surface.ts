import { spring } from 'svelte/motion'
/** A physical entrance for the composer; centering/focus remain the dialog's job. */
export function springSurface(node: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const progress = spring(reduced.matches ? 1 : 0, { stiffness: .1, damping: .82, precision: .001 })
  node.dataset.springSurface = 'true'
  const unsubscribe = progress.subscribe(value => node.style.setProperty('--surface-progress', String(Math.max(0, Math.min(1, value)))))
  const stop = () => { if (reduced.matches) void progress.set(1, { hard: true }) }
  reduced.addEventListener('change', stop)
  void progress.set(1)
  return { destroy() { unsubscribe(); reduced.removeEventListener('change', stop) } }
}
