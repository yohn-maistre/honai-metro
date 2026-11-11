/** Device-local presentation only. Never an enrollment or membership decision. */
export const WELCOME_SEEN = 'etnos.welcome.v1'
export function hasSeenWelcome() {
  try { return localStorage.getItem(WELCOME_SEEN) === 'seen' }
  catch { return false }
}
export function rememberWelcome() {
  try { localStorage.setItem(WELCOME_SEEN, 'seen') }
  catch { /* Reading and authentication work without optional device storage. */ }
}
export function safeBrowsePath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/'
  try {
    const u = new URL(value, 'https://etnos.invalid')
    if (u.origin !== 'https://etnos.invalid' || /^\/(?:login|auth|oauth)(?:\/|$)/.test(u.pathname)) return '/'
    return u.pathname + u.search + u.hash
  } catch { return '/' }
}
export function hasBootedThisSession() {
  try { return sessionStorage.getItem('etnos.boot.v1') === 'shown' }
  catch { return true }
}
export function rememberBoot() {
  try { sessionStorage.setItem('etnos.boot.v1', 'shown') }
  catch { /* Optional presentation state, never a login token. */ }
}
