import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wikiDiff } from '../src/wiki-diff.ts'
import {
  saveWikiDraft,
  readWikiDraft,
  removeWikiDraft,
  clearWikiDrafts,
  type WikiDraft,
} from '../src/wiki-drafts.ts'

test('line review reconstructs both exact documents, including duplicate lines and untrusted markup', () => {
  for (const [before, after] of [
    ['a\nb\na\nc', 'a\nb\nc\nd'],
    ['', 'first'],
    ['<script>one</script>', '<img src=x onerror=alert(1)>'],
    ['a\n', 'a\nb\n'],
  ]) {
    const { changes } = wikiDiff(before, after)
    assert.equal(
      changes
        .filter((c) => c.kind !== 'added')
        .map((c) => c.text)
        .join('\n'),
      before,
    )
    assert.equal(
      changes
        .filter((c) => c.kind !== 'removed')
        .map((c) => c.text)
        .join('\n'),
      after,
    )
  }
  assert.equal(wikiDiff('a\n'.repeat(600), 'b\n'.repeat(600)).abbreviated, true)
})

test('wiki recovery isolates accounts and pages, expires, clears on logout and tolerates denied storage', () => {
  const data: Record<string, string> = {}
  globalThis.sessionStorage = Object.assign(data, {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v
    },
    removeItem: (k: string) => {
      delete data[k]
    },
  }) as unknown as Storage
  const draft: WikiDraft = {
    page: 'page-a',
    community: 'public',
    base: 'revision-a',
    text: 'unsent',
    title: '',
    citations: '',
    language: 'id',
    perspective: 'author',
    requestKey: 'request',
    saved: Date.now(),
  }
  assert.equal(saveWikiDraft('one', draft), true)
  assert.equal(readWikiDraft('two', 'page-a'), null)
  assert.equal(readWikiDraft('one', 'page-b'), null)
  assert.equal(readWikiDraft('one', 'page-a')?.base, 'revision-a')
  saveWikiDraft('two', draft)
  clearWikiDrafts('one')
  assert.equal(readWikiDraft('one', 'page-a'), null)
  assert.equal(readWikiDraft('two', 'page-a')?.text, 'unsent')
  saveWikiDraft('two', { ...draft, saved: Date.now() - 86400001 })
  assert.equal(readWikiDraft('two', 'page-a'), null)
  removeWikiDraft('two', 'page-a')
  globalThis.sessionStorage = {
    setItem() {
      throw new Error('denied')
    },
    getItem() {
      throw new Error('denied')
    },
    removeItem() {
      throw new Error('denied')
    },
  } as unknown as Storage
  assert.equal(saveWikiDraft('one', draft), false)
  assert.equal(readWikiDraft('one', 'page-a'), null)
  clearWikiDrafts('one')
})
