import assert from 'node:assert/strict'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision(
    'did:web:november-fixture.example',
    'giyaibo.bsky.social',
  ),
  community = s.createCommunity(
    owner.actor.id,
    'Mee fixture',
    'Percakapan, bahasa dan pengetahuan bersama.',
    'public',
  )
s.createCommunity(
  owner.actor.id,
  'Kabar fixture',
  'Berbagi dari wilayah.',
  'public',
)
const posts = []
for (let i = 0; i < 18; i++)
  posts.push(
    s.createPost(
      owner.actor.id,
      community.id,
      'Synthetic conversation ' +
        i +
        ' — ' +
        'Percakapan yang bisa dibaca dengan nyaman. '.repeat(3),
    ),
  )
s.createPost(owner.actor.id, community.id, 'Synthetic reply', posts[0].id)
const handler = api(s),
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    videoRequests = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    if (r.url().includes('youtube-nocookie.com')) videoRequests.push(r)
  })
  await page.route('**/auth/me', (r) =>
    r.fulfill({ json: { actor: owner.actor, csrf: 'fixture', steward: true } }),
  )
  await page.route('https://www.youtube-nocookie.com/**', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<html>Fixture player</html>',
    }),
  )
  await page.route('**/v1/**', async (r) => {
    const q = r.request(),
      u = new URL(q.url())
    // Public metadata is a web Worker port, separate from the core API fixture.
    if (u.pathname === '/v1/link-preview')
      return r.fulfill({ json: { available: false } })
    if (u.pathname.startsWith('/v1/video-preview/'))
      return r.fulfill({
        json: {
          title: 'Synthetic cover and title',
          provider: 'YouTube',
          image: null,
        },
      })
    if (u.pathname === '/v1/news')
      return r.fulfill({
        json: {
          source: {
            name: 'West Papua Watch',
            url: 'https://westpapua.watch/news/',
          },
          available: true,
          items: Array.from({ length: 9 }, (_, i) => ({
            id: String(42 + i),
            title: [
              'Bahasa tumbuh di percakapan sehari-hari',
              'Dari kampung ke pengetahuan bersama',
              'Kabar terbaru dari wilayah',
            ][i % 3],
            url: 'https://westpapua.watch/story/?id=' + (42 + i),
            publishedAt: '2026-11-02T10:00:00Z',
            sourceCount: 2,
            image: null,
          })),
        },
      })
    if (u.pathname === '/v1/news/42')
      return r.fulfill({
        json: {
          id: '42',
          title: 'Bahasa tumbuh di percakapan sehari-hari',
          summary:
            'Ringkasan sintetis untuk menguji tampilan kabar, sumber dan percakapan.',
          url: 'https://westpapua.watch/story/?id=42',
          sourceCount: 1,
          publishedAt: '2026-11-02T10:00:00Z',
          image: null,
          keyPoints: ['Pengetahuan tetap terhubung ke sumber.'],
          places: [
            {
              name: 'Puncak',
              slug: 'puncak',
              latitude: -3.6,
              longitude: 137.5,
            },
          ],
          sources: [
            {
              title: 'Sumber fixture',
              url: 'https://example.org/story',
              publisher: 'Sumber publik',
              summary: 'Kutipan singkat.',
            },
          ],
        },
      })
    const response = await handler(
      new Request(q.url(), {
        method: q.method(),
        headers: {
          ...q.headers(),
          authorization: 'Bearer ' + owner.token,
          origin,
        },
        ...(q.method() === 'POST' ? { body: q.postData() } : {}),
      }),
    )
    return r.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByText(/Synthetic conversation 17/)
    .first()
    .waitFor()
  const target = page.locator('a[href="/square/' + posts[10].id + '"]').first()
  await target.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await target.click()
  await page.getByLabel('Tulis balasan', { exact: true }).waitFor()
  const layout = await page.evaluate(() => {
    const parent =
        document.querySelector('.conversation-view > .cx-post') ??
        document.querySelector('.conversation-view > article'),
      composer = document.querySelector('.thread-reply-dock'),
      discussion = document.querySelector('.thread-discussion')
    return {
      reply: composer.getBoundingClientRect().top,
      discussion: discussion.getBoundingClientRect().top,
      parent: parent?.getBoundingClientRect().bottom,
    }
  })
  assert.ok(layout.reply < layout.discussion)
  assert.ok(Math.abs(layout.reply - layout.parent) < 3)
  await page.getByRole('button', { name: 'Kembali', exact: true }).click()
  await page
    .getByText(/Synthetic conversation 17/)
    .first()
    .waitFor()
  await page.waitForFunction((y) => Math.abs(scrollY - y) < 4, before)
  await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('main .news-item').count(), 3)
  assert.equal(await page.locator('aside .news-section').count(), 0)
  await page.locator('main a[href="/news/42"]').click()
  await page.getByRole('heading', { name: 'Sumber liputan' }).waitFor()
  assert.equal(await page.locator('.news-map svg circle').count(), 1)
  await page
    .getByRole('button', { name: 'Bahas di komunitas', exact: true })
    .click()
  await page.getByRole('dialog', { name: 'Posting baru' }).waitFor()
  await page
    .getByRole('dialog')
    .getByLabel('Posting', { exact: true })
    .fill('A source-linked forum discussion')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Posting', exact: true })
    .click()
  await page
    .getByText('A source-linked forum discussion', { exact: true })
    .waitFor()
  const created = s
    .feed(owner.actor.id)
    .find((p) => p.text === 'A source-linked forum discussion')
  assert.equal(created.content.url, 'https://westpapua.watch/story/?id=42')
  await page.goto(origin + '/news/42', { waitUntil: 'networkidle' })
  await page
    .getByText('A source-linked forum discussion', { exact: true })
    .waitFor()
  await page.screenshot({
    path: artifactDir + '/november-news-1440.png',
    fullPage: true,
  })
  await page.goto(origin + '/board', { waitUntil: 'networkidle' })
  await page.locator('.feed-column').first().waitFor()
  assert.equal(await page.locator('.feed-column').count(), 2)
  await page.getByRole('button', { name: 'Lajur', exact: true }).click()
  assert.equal(await page.locator('.feed-column').count(), 3)
  assert.equal(
    await page.getByRole('button', { name: 'Lajur', exact: true }).isDisabled(),
    true,
  )
  await page.screenshot({ path: artifactDir + '/november-board-1440.png' })
  const peer = s.provision('did:web:november-peer.example', 'Synthetic peer')
  s.setMember(owner.actor.id, community.id, peer.actor.id, true)
  for (let i = 0; i < 14; i++)
    s.createPost(peer.actor.id, community.id, 'Additional community post ' + i)
  await page.goto(origin + '/communities/' + community.id, {
    waitUntil: 'networkidle',
  })
  await page
    .getByRole('button', { name: 'Muat posting lain', exact: true })
    .click()
  await page.waitForFunction(
    () => document.querySelectorAll('main .cx-post').length === 33,
  )
  await page.getByRole('tab', { name: 'Media', exact: true }).click()
  await page
    .getByRole('heading', { name: 'Belum ada media yang dimuat', exact: true })
    .waitFor()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/',
      '/explore',
      '/news/42',
      '/people/' + owner.actor.id,
      '/communities/' + community.id,
      '/board',
    ]) {
      await page.goto(origin + route, { waitUntil: 'networkidle' })
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        route + ' overflow ' + width,
      )
      if (route === '/' && width < 768)
        assert.equal(
          await page
            .getByRole('button', { name: 'Semua ruang', exact: true })
            .count(),
          1,
        )
      if (width === 390 || width === 1440)
        await page.screenshot({
          path:
            artifactDir +
            '/november-' +
            route.replaceAll('/', '_') +
            '-' +
            width +
            '.png',
          fullPage: route !== '/',
        })
    }
  }
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(origin + '/square/' + posts[0].id, {
    waitUntil: 'networkidle',
  })
  assert.equal(
    await page
      .locator('.thread-reply-dock')
      .evaluate((el) => getComputedStyle(el).position),
    'fixed',
  )
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Posting', exact: true })
    .first()
    .click()
  const previewRequest = page.waitForResponse((r) =>
    r.url().includes('/v1/video-preview/'),
  )
  await page
    .getByRole('dialog')
    .getByLabel('Posting', { exact: true })
    .fill('https://www.youtube.com/watch?v=ZWp5904RkJY')
  await previewRequest
  await page.getByText('Synthetic cover and title', { exact: true }).waitFor()
  assert.equal(await page.locator('iframe').count(), 0)
  assert.equal(videoRequests.length, 0)
  await page.getByRole('button', { name: 'Putar video', exact: true }).click()
  await page.locator('iframe').waitFor()
  assert.equal(
    await page.locator('iframe').getAttribute('referrerpolicy'),
    'strict-origin-when-cross-origin',
  )
  await page.getByRole('button', { name: 'Opsi konten', exact: true }).click()
  await page
    .getByRole('menuitem', { name: 'Jajak pendapat', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Tambah pilihan', exact: true })
    .click()
  assert.equal(await page.locator('.poll-choice-row').count(), 3)
  await page
    .getByRole('button', { name: 'Hapus pilihan 3', exact: true })
    .click()
  assert.equal(await page.locator('.poll-choice-row').count(), 2)
  await page.screenshot({ path: artifactDir + '/november-poll-video-390.png' })
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      desktopReplyBelowPost: true,
      scrollRestored: true,
      nativeNews: true,
      relatedDiscussion: true,
      threeColumns: true,
      composerVideoPreview: true,
      pollChoiceRemoval: true,
      widths: [320, 390, 768, 1440],
      realPublicWrites: 0,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
