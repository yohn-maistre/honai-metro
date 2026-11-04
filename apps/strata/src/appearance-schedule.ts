export type ThemeMode = 'clock' | 'light' | 'dark'
/** Device-local schedule, without geolocation, remote weather or solar claims. */
export function scheduledTheme(
  mode: ThemeMode,
  now = new Date(),
): 'light' | 'dark' {
  if (mode !== 'clock') return mode
  return now.getHours() >= 6 && now.getHours() < 18 ? 'light' : 'dark'
}
