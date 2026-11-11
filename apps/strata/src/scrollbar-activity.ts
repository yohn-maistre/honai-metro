/** Presentation only. Passive observation never replaces or blocks native scrolling. */
export function observeScrollbarActivity() {
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>()
  const scroll = (event: Event) => {
    const node = event.target === document ? document.documentElement : event.target
    if (!(node instanceof HTMLElement) || node === document.documentElement || node === document.body) return
    clearTimeout(timers.get(node))
    node.dataset.scrollActive = 'true'
    timers.set(node, setTimeout(() => { delete node.dataset.scrollActive; timers.delete(node) }, 900))
  }
  document.addEventListener('scroll', scroll, { capture: true, passive: true })
  return () => {
    document.removeEventListener('scroll', scroll, true)
    for (const [node, timer] of timers) { clearTimeout(timer); delete node.dataset.scrollActive }
    timers.clear()
  }
}
