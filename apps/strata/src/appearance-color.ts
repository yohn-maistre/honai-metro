/** Contrast roles for valid #RRGGBB presentation seeds. */
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const hex = (v: number[]) =>
  '#' + v.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')
export function luminance(color: string) {
  return rgb(color)
    .map((n) => n / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
    .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0)
}
export function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
export function accentRoles(seed: string, dark: boolean) {
  const background = dark ? '#151516' : '#faf9f6'
  const base = rgb(seed),
    target = dark ? 255 : 0
  let ink = seed
  for (
    let step = 0;
    step <= 100 && contrast(ink, dark ? '#2a292c' : '#eeeae5') < 4.7;
    step++
  )
    ink = hex(base.map((n) => n + ((target - n) * step) / 100))
  return {
    ink,
    foreground:
      contrast(ink, '#ffffff') > contrast(ink, '#000000')
        ? '#ffffff'
        : '#000000',
    soft: hex(rgb(background).map((n, i) => n * 0.95 + rgb(ink)[i] * 0.05)),
  }
}
