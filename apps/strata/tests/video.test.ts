import assert from 'node:assert/strict'
import { test } from 'node:test'
import { videoEmbed, directVideo } from '../src/markdown.ts'
test('video previews accept fixed iframe providers and bounded native file types', () => {
  assert.equal(
    videoEmbed('https://youtu.be/ZWp5904RkJY'),
    'https://www.youtube-nocookie.com/embed/ZWp5904RkJY',
  )
  assert.equal(
    videoEmbed('https://www.youtube.com/watch?v=ZWp5904RkJY'),
    'https://www.youtube-nocookie.com/embed/ZWp5904RkJY',
  )
  for (const url of [
    'javascript:alert(1)',
    'https://www.youtube.com.evil.example/watch?v=ZWp5904RkJY',
    'https://youtu.be/<script>',
  ])
    assert.equal(videoEmbed(url), null)
  assert.equal(
    directVideo('https://cdn.example.org/clip.mp4?token=public'),
    'https://cdn.example.org/clip.mp4?token=public',
  )
  for (const url of [
    'https://127.0.0.1/x.mp4',
    'http://cdn.example.org/x.mp4',
    'https://user:secret@cdn.example.org/x.mp4',
    'https://private.local/x.mp4',
    'https://cdn.example.org/payload.svg',
    'https://cdn.example.org/file.mp4/other',
  ])
    assert.equal(directVideo(url), null)
})
