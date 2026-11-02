/** Touch dismissal layered on the existing focus-trapped Sheet. Browser back wins. */
export function drawerGesture(node: HTMLElement, close: () => void) {
  let origin: { x: number; y: number; at: number; id: number } | null = null
  let offset = 0,
    dragging = false,
    suppressClick = false
  const panel = () => node.closest<HTMLElement>('[role="dialog"]')
  const reset = () => {
    const el = panel()
    if (el) {
      el.style.translate = ''
      el.style.transition = ''
    }
    origin = null
    offset = 0
    dragging = false
  }
  function start(e: PointerEvent) {
    if (
      e.pointerType !== 'touch' ||
      e.clientX < 24 ||
      (e.target as Element).closest(
        'input,textarea,select,[contenteditable], [data-no-drag]',
      )
    )
      return
    origin = {
      x: e.clientX,
      y: e.clientY,
      at: performance.now(),
      id: e.pointerId,
    }
  }
  function move(e: PointerEvent) {
    if (!origin || e.pointerId !== origin.id) return
    const x = e.clientX - origin.x,
      y = e.clientY - origin.y
    if (!dragging && Math.abs(y) > 12 && Math.abs(y) > Math.abs(x))
      return reset()
    if (x < -12 && Math.abs(x) > Math.abs(y) * 1.4) dragging = true
    if (!dragging) return
    e.preventDefault()
    offset = Math.min(0, x)
    const el = panel()
    if (el) {
      el.style.transition = 'none'
      el.style.translate = `${offset}px 0`
    }
  }
  function end() {
    if (!origin) return
    const dismiss =
      dragging &&
      (offset < -80 ||
        (offset < -32 && -offset / (performance.now() - origin.at) > 0.6))
    suppressClick = dragging
    reset()
    if (dismiss) close()
    if (suppressClick) setTimeout(() => (suppressClick = false), 0)
  }
  function click(e: MouseEvent) {
    if (suppressClick) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  node.addEventListener('pointerdown', start)
  node.addEventListener('pointermove', move, { passive: false })
  node.addEventListener('pointerup', end)
  node.addEventListener('pointercancel', reset)
  node.addEventListener('click', click, true)
  return {
    destroy() {
      reset()
      node.removeEventListener('pointerdown', start)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', end)
      node.removeEventListener('pointercancel', reset)
      node.removeEventListener('click', click, true)
    },
  }
}
