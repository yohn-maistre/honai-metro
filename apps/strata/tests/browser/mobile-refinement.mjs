import assert from 'node:assert/strict'
import {
  Strata,
  Groups,
  api,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision(
    'did:web:mobile-fixture.example',
    'Synthetic mobile member',
  ),
  community = s.createCommunity(
    owner.actor.id,
    'Fixture room',
    'A local fixture.',
    'public',
  ),
  group = new Groups(s).create(
    owner.actor.id,
    'Fixture institute',
    'Public scope',
    'collective',
    'public',
  ),
  handler = api(s)
s.run(
  'INSERT INTO actor_profiles VALUES(?,?,?,?)',
  owner.actor.id,
  'Catatan, bahasa dan cerita bersama.',
  'https://example.org/',
  'Papua',
)
for (let i = 0; i < 8; i++)
  s.createPost(
    owner.actor.id,
    community.id,
    'Fixture conversation ' +
      i +
      '. ' +
      'A longer conversation with room to read. '.repeat(6),
  )
s.createPost(
  owner.actor.id,
  community.id,
  'A public video',
  undefined,
  undefined,
  { content: { url: 'https://www.youtube.com/watch?v=ZWp5904RkJY' } },
)
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 720 } }),
    errors = [],
    players = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    if (r.url().includes('youtube-nocookie.com')) players.push(r.url())
  })
  const cover = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 360
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 480, 360)
    ctx.fillStyle = '#60746f'
    ctx.fillRect(0, 45, 480, 270)
    ctx.fillStyle = '#dedbd1'
    ctx.font = '28px sans-serif'
    ctx.fillText('Local video cover', 60, 180)
    return canvas.toDataURL('image/png').split(',')[1]
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
    if (u.pathname.startsWith('/v1/video-preview/'))
      return r.fulfill(
        u.pathname.endsWith('/image')
          ? { contentType: 'image/png', body: Buffer.from(cover, 'base64') }
          : {
              json: {
                provider: 'YouTube',
                title:
                  'A public video title that stays on one line without making a second bezel',
                image: '/v1/video-preview/youtube/ZWp5904RkJY/image',
              },
            },
      )
    if (u.pathname === '/v1/link-preview')
      return r.fulfill({ json: { available: false } })
    if (u.pathname === '/v1/news')
      return r.fulfill({
        json: {
          available: true,
          items: [],
          source: {
            name: 'West Papua Watch',
            url: 'https://westpapua.watch/news/',
          },
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
  await page.goto(origin + '/board', { waitUntil: 'networkidle' })
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.texture),
    'grain',
  )
  assert.equal(new URL(page.url()).pathname, '/')
  assert.equal(
    await page.locator('.feed-column, .home-layout-switch').count(),
    0,
  )
  const play = page.getByRole('button', { name: 'Putar video', exact: true })
  await play.scrollIntoViewIfNeeded()
  await page.locator('.video-cover img').waitFor()
  assert.equal(players.length, 0)
  assert.equal(await page.locator('iframe,video').count(), 0)
  const media = await page.locator('.video-card').evaluate((el) => {
    const card = el.getBoundingClientRect(),
      frame = el.querySelector('.video-preview').getBoundingClientRect(),
      caption = el.querySelector('.video-card-caption').getBoundingClientRect()
    return {
      card: card.height,
      frame: frame.height,
      ratio: frame.width / frame.height,
      captionBottom: caption.bottom,
      frameBottom: frame.bottom,
    }
  })
  assert.ok(Math.abs(media.card - media.frame) < 2, JSON.stringify(media))
  assert.ok(Math.abs(media.ratio - 16 / 9) < 0.03, JSON.stringify(media))
  assert.ok(media.captionBottom <= media.frameBottom + 1)
  await page.screenshot({ path: artifactDir + '/mobile-clean-video-390.png' })
  await play.click()
  await page.locator('iframe').waitFor()
  assert.equal(await page.locator('.video-card-caption').count(), 0)
  await page.getByText(/^Fixture conversation 0\./).scrollIntoViewIfNeeded()
  assert.ok(
    await page.evaluate(() => scrollY > 100),
    'The phone feed scrolls with the page',
  )
  await page.setViewportSize({ width: 320, height: 568 })
  await page.getByRole('button', { name: 'Buka menu', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: 'Navigasi' })
  await drawer.waitFor()
  const oneScroller = await drawer.evaluate((el) => {
    function scroller(n) {
      for (let p = n.parentElement; p; p = p.parentElement)
        if (
          /(auto|scroll)/.test(getComputedStyle(p).overflowY) &&
          p.scrollHeight > p.clientHeight + 1
        )
          return p
      return null
    }
    const composeScroller = scroller(el.querySelector('.sidebar-compose'))
    return (
      composeScroller !== null &&
      composeScroller === scroller(el.querySelector('.account-link'))
    )
  })
  assert.ok(oneScroller, 'Compose and account share the same drawer scroller')
  await drawer
    .getByRole('link', { name: 'Pengaturan', exact: true })
    .scrollIntoViewIfNeeded()
  await drawer
    .getByRole('button', { name: 'Posting', exact: true })
    .scrollIntoViewIfNeeded()
  const compose = await drawer
    .getByRole('button', { name: 'Posting', exact: true })
    .boundingBox()
  assert.ok(compose.y >= 0 && compose.y + compose.height <= 568)
  await page.screenshot({ path: artifactDir + '/mobile-single-menu-320.png' })
  await drawer.getByRole('link', { name: 'Pesan', exact: true }).click()
  await drawer.waitFor({ state: 'hidden' })
  await page.goto(origin + '/groups/' + group.id, { waitUntil: 'networkidle' })
  assert.equal(
    await page.getByRole('button', { name: 'Kembali', exact: true }).count(),
    1,
  )
  assert.equal(await page.locator('.cx-back').count(), 0)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 960 })
    await page.goto(origin + '/people/' + owner.actor.id, {
      waitUntil: 'networkidle',
    })
    await page
      .getByText('Catatan, bahasa dan cerita bersama.', { exact: true })
      .waitFor()
    const profile = await page.locator('.profile-intro h1').boundingBox()
    const frame = await page.locator('.profile-content').boundingBox()
    assert.ok(Math.abs(profile.x - frame.x) < 30)
    assert.equal(
      await page
        .getByRole('button', { name: 'Edit profil', exact: true })
        .count(),
      1,
    )
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    await page.screenshot({
      path: artifactDir + '/mobile-profile-' + width + '.png',
      fullPage: true,
    })
    await page.goto(origin + '/board', { waitUntil: 'networkidle' })
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    await page.screenshot({
      path: artifactDir + '/mobile-home-' + width + '.png',
      fullPage: width < 768,
    })
  }
  await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
  const spacing = await page
    .locator('.discovery-nav a')
    .first()
    .evaluate(
      (el) =>
        el.getBoundingClientRect().top -
        document.querySelector('.cx-topbar').getBoundingClientRect().bottom,
    )
  assert.ok(
    spacing >= 16,
    'Explore shortcuts have breathing room below the header',
  )
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('strata.ui.appearance'))
    localStorage.setItem(
      'strata.ui.appearance',
      JSON.stringify({ ...saved, texture: 'none' }),
    )
  })
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.texture),
    'none',
  )
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      realPublicWrites: 0,
      pageScroll: true,
      oneBackControl: true,
      oneDrawerScroller: true,
      bottomMenu: true,
      coverOnlyUntilPlay: true,
      noVideoBezel: true,
      seratDefault: true,
      profileWidths: [320, 390, 768, 1440],
      errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
