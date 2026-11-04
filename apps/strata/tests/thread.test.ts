import { test } from 'node:test'
import assert from 'node:assert/strict'
import { replyTree } from '../src/thread.ts'
import type { Post } from '../src/api.ts'
test('reply order keeps descendants with their parent and retains missing-parent context across pages', () => {
  const make = (id: string, parent: string, created: number, score: number) =>
    ({ id, parent_id: parent, created, score }) as Post
  const posts = [
    make('child', 'a', 3, 10),
    make('b', 'root', 2, 5),
    make('a', 'root', 1, 0),
    make('orphan', 'unloaded', 4, 1),
  ]
  const top = replyTree(posts, 'root', 'top')
  assert.deepEqual(
    top.map((n) => n.post.id),
    ['b', 'orphan', 'a'],
  )
  assert.equal(top[2].children[0].post.id, 'child')
  assert.equal(top[1].missingParent, true)
  assert.deepEqual(
    replyTree(posts, 'root', 'new').map((n) => n.post.id),
    ['orphan', 'b', 'a'],
  )
  assert.deepEqual(
    posts.map((p) => p.id),
    ['child', 'b', 'a', 'orphan'],
  )
})
