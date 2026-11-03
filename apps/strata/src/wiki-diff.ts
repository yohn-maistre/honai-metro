/** Bounded line comparison. Return text tokens, never trusted HTML. */
export type Change = { kind: 'same' | 'added' | 'removed'; text: string }
export function wikiDiff(
  before: string,
  after: string,
): { changes: Change[]; abbreviated: boolean } {
  const a = before.split('\n'),
    b = after.split('\n')
  if (a.length * b.length > 250000)
    return {
      changes: [
        { kind: 'removed', text: before },
        { kind: 'added', text: after },
      ],
      abbreviated: true,
    }
  const rows = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  )
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      rows[i][j] =
        a[i] === b[j]
          ? rows[i + 1][j + 1] + 1
          : Math.max(rows[i + 1][j], rows[i][j + 1])
  const changes: Change[] = []
  let i = 0,
    j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      changes.push({ kind: 'same', text: a[i] })
      i++
      j++
    } else if (
      j < b.length &&
      (i === a.length || rows[i][j + 1] >= rows[i + 1][j])
    ) {
      changes.push({ kind: 'added', text: b[j++] })
    } else changes.push({ kind: 'removed', text: a[i++] })
  }
  return { changes, abbreviated: false }
}
export function languageName(code: string) {
  try {
    return new Intl.DisplayNames(['id'], { type: 'language' }).of(code) || code
  } catch {
    return code
  }
}
