import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accentRoles, contrast } from '../src/appearance-color.ts'

test('palette presets and custom seeds retain readable accent text and button labels in both themes', () => {
  const seeds = [
    '#c5b0e2',
    '#aa8bd5',
    '#b7775c',
    '#7b9287',
    '#8b8b95',
    '#000000',
    '#ffffff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    ...Array.from(
      { length: 400 },
      (_, i) => '#' + ((i * 41611) % 0x1000000).toString(16).padStart(6, '0'),
    ),
  ]
  for (const dark of [false, true])
    for (const seed of seeds) {
      const roles = accentRoles(seed, dark)
      assert.ok(contrast(roles.ink, dark ? '#2a292c' : '#eeeae5') >= 4.7, seed)
      assert.ok(contrast(roles.ink, roles.foreground) >= 4.5, seed)
    }
})

import { bases, baseRoles } from '../src/appearance-bases.ts'
test('every base ramp has readable body and secondary text in both themes', () => {
  for (const base of bases)
    for (const dark of [false, true]) {
      const roles = baseRoles(base.id, dark)
      for (const surface of [
        '--reading-surface',
        '--page-ground',
        '--secondary',
      ] as const) {
        assert.ok(
          contrast(roles['--foreground'], roles[surface]) >= 4.5,
          base.id + ' primary',
        )
        assert.ok(
          contrast(roles['--muted-foreground'], roles[surface]) >= 4.5,
          base.id + ' muted ' + surface,
        )
      }
    }
})
