/** Stable presentation from an opaque ID, never inferred identity or status. */
export function avatarTone(id: string) {
  let hash = 2166136261
  for (const char of id) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619)
  const hues = [25, 78, 145, 195, 250, 300, 350]
  return `--avatar-hue:${hues[(hash >>> 0) % hues.length]}`
}
