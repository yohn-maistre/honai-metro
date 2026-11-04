/** Keep a horizontal tab strip local; selecting a tab never scrolls the page. */
export function tabScroll(node: HTMLElement) {
  let frame = 0
  const reveal = (element?: Element | null) => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const target = element ?? node.querySelector('[data-state="active"],[aria-pressed="true"],[aria-current="page"]')
      if (!(target instanceof HTMLElement) || !node.contains(target)) return
      const box = node.getBoundingClientRect(), rect = target.getBoundingClientRect()
      if (rect.left < box.left + 12) node.scrollLeft -= box.left + 12 - rect.left
      else if (rect.right > box.right - 12) node.scrollLeft += rect.right - box.right + 12
    })
  }
  const focus = (event: FocusEvent) => reveal(event.target as Element)
  const observer = new MutationObserver(() => reveal())
  observer.observe(node, {subtree: true, attributes: true, attributeFilter: ['data-state','aria-pressed','aria-current']})
  node.addEventListener('focusin', focus)
  reveal()
  return {destroy() {cancelAnimationFrame(frame);observer.disconnect();node.removeEventListener('focusin',focus)}}
}
