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

import { scheduledTheme } from '../src/appearance-schedule.ts'
import { themeFrame, THEME_SHIFT_MS } from '../src/appearance-transition.ts'
test('automatic theme follows local clock boundaries and manual choices override the clock', () => {
  for (const [hour, minute, expected] of [
    [5, 59, 'dark'],
    [6, 0, 'light'],
    [17, 59, 'light'],
    [18, 0, 'dark'],
    [23, 59, 'dark'],
  ] as const) {
    const now = new Date(2026, 10, 4, hour, minute)
    assert.equal(scheduledTheme('clock', now), expected)
    assert.equal(scheduledTheme('light', now), 'light')
    assert.equal(scheduledTheme('dark', now), 'dark')
  }
})
test('slow automatic shifts preserve body and action contrast through both directions on every base', () => {
  assert.ok(THEME_SHIFT_MS >= 30000)
  for (const base of bases)
    for (const direction of [true, false])
      for (let step = 0; step <= 200; step++) {
        const frame = themeFrame(base.id, direction, step / 200, '#1680fa')
        for (const ink of ['--foreground', '--muted-foreground', '--brand'])
          for (const surface of [
            '--page-ground',
            '--reading-surface',
            '--secondary',
          ])
            assert.ok(
              contrast(frame[ink], frame[surface]) >= 4.5,
              `${base.id} ${direction} ${step}: ${ink} on ${surface}`,
            )
        assert.ok(
          contrast(frame['--brand'], frame['--brand-foreground']) >= 4.5,
        )
      }
})
