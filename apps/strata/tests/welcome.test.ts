import assert from 'node:assert/strict'
import test from 'node:test'
import { safeBrowsePath } from '../src/welcome.ts'

test('dismissing direct auth stays on a local reading route, never an external URL or auth loop', () => {
  for (const input of [null, '', '//elsewhere.example', 'https://elsewhere.example', '/\\elsewhere.example', '/login?mode=signup', '/auth/start', '/oauth/callback', '/a/../login', '/\n/elsewhere.example'])
    assert.equal(safeBrowsePath(input), '/', String(input))
  assert.equal(safeBrowsePath('/wiki/shared-notes?language=id#sources'), '/wiki/shared-notes?language=id#sources')
  assert.equal(safeBrowsePath('/communities'), '/communities')
})
