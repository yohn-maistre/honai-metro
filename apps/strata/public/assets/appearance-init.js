/* Paint the saved/device-clock ground before the module loads. No network or identity. */
(() => {
  let saved = null, legacy = null
  try {
    saved = JSON.parse(localStorage.getItem('strata.ui.appearance') || 'null')
    legacy = localStorage.getItem('strata.ui.theme')
  } catch { /* Optional device storage. */ }
  const mode = ['light', 'dark', 'clock'].includes(saved?.themeMode)
    ? saved.themeMode
    : ['light', 'dark'].includes(saved?.theme || legacy) ? saved?.theme || legacy : 'clock'
  const hour = new Date().getHours(), dark = mode === 'dark' || mode === 'clock' && (hour < 6 || hour >= 18)
  const grounds = {paper:['#f1eee8','#12110f'],graphite:['#fafafa','#0a0a0a'],stone:['#eeefec','#10120f'],ink:['#edf0f4','#0c1015']}
  const base = Object.hasOwn(grounds, saved?.base) ? saved.base : 'paper'
  const root = document.documentElement
  root.style.setProperty('--page-ground', grounds[base][dark ? 1 : 0])
  root.style.backgroundColor = 'var(--page-ground)'
  root.style.colorScheme = dark ? 'dark' : 'light'
  root.classList.toggle('dark', dark)
})()
