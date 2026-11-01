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
