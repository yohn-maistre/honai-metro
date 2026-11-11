/** Ephemeral feedback only. The activity inbox remains a durable, access-checked record. */
import { toast } from '@yusufceng1z/ding-svelte'

export const notificationPreferences = $state({ sound: true, volume: 0.35 })
const storageKey = 'strata.ui.notifications'

export function configureNotifications() {
  toast.configure({
    sound: notificationPreferences.sound,
    volume: notificationPreferences.volume,
  })
  try {
    localStorage.setItem(storageKey, JSON.stringify(notificationPreferences))
  } catch { /* Optional device preference. */ }
}

export function restoreNotificationPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (typeof saved?.sound === 'boolean') notificationPreferences.sound = saved.sound
    if (typeof saved?.volume === 'number' && Number.isFinite(saved.volume))
      notificationPreferences.volume = Math.max(0, Math.min(1, saved.volume))
  } catch { /* Readable without device storage. */ }
  configureNotifications()
}

// Keep all callers on one host. Do not toast background reads, initial inbox history,
// or field validation; those retain their contextual states and announcements.
export const notify = (title: string) => toast.success(title)
export const notifyInfo = (title: string) => toast.info(title)
export const notifyError = (error: unknown) => toast.error(
  error instanceof Error ? error.message : typeof error === 'string'
    ? error : 'Permintaan belum dapat diselesaikan.',
)
export const dismissNotifications = () => toast.dismiss(undefined, { immediate: true })
