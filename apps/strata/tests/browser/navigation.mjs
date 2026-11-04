// Disposable loopback-only fixture; no deployed writes or agent identities.
import assert from 'node:assert/strict'
import {
  Strata,
  Groups,
  api,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
const s = new Strata(':memory:', origin)
const owner = s.provision(
  'did:web:navigation-fixture.example',
  'Synthetic member',
)
const g = new Groups(s, { stewardDid: owner.actor.did })
const room = s.createCommunity(
  owner.actor.id,
  'Public stories',
  'A public room.',
  'public',
)
const secret = s.createCommunity(
  owner.actor.id,
  'Protected language recordings',
  'Private cultural data.',
  'hidden-private',
)
const organization = g.create(
  owner.actor.id,
  'Public institute',
  'Accountable group',
  'institution',
  'public',
)
g.bind(owner.actor.id, organization.id, room.id)
g.bind(owner.actor.id, organization.id, secret.id)
const hiddenGroup = g.create(
  owner.actor.id,
  'Hidden organisation name',
  'Private parent',
  'collective',
  'hidden-private',
)
const independent = s.createCommunity(
  owner.actor.id,
  'Independent public room',
  'Public room in a hidden group.',
  'public',
)
g.bind(owner.actor.id, hiddenGroup.id, independent.id)
g.createContext(owner.actor.id, {
  slug: 'jayapura',
  title: 'Jayapura',
  kind: 'place',
  description: 'Synthetic place',
  language: 'id',
  aliases: [],
})
s.createPost(
  owner.actor.id,
  room.id,
  'A public conversation with a long link preview.',
  undefined,
  undefined,
  { content: { url: 'https://westpapua.watch/story/?id=1' } },
)
const handler = api(s, { stewardDid: owner.actor.did })
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
let guest = true
const errors = []
try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: 'Asia/Jayapura',
  })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errors.push(e.message))
  await p.route('**/auth/me', (r) =>
    r.fulfill({
      json: guest ? {} : { actor: owner.actor, csrf: 'fixture', steward: true },
    }),
  )
  await p.route('**/broken-photo.png', (r) =>
    r.fulfill({ status: 404, body: '' }),
  )
  await p.route('**/v1/**', async (r) => {
    const q = r.request(),
      u = new URL(q.url())
    if (u.pathname === '/v1/news')
      return r.fulfill({
        json: {
          available: true,
          items: [1, 2, 3].map((id) => ({
            id: String(id),
            title: 'Synthetic news headline ' + id,
            summary:
              'The report remains readable when its photograph cannot be loaded.',
            publishedAt: '2026-11-03T00:00:00Z',
            image: origin + '/broken-photo.png',
            imageCredit: 'Missing photo credit',
            sourceCount: 1,
          })),
          source: { name: 'WPW', url: 'https://westpapua.watch/' },
          selection: { total: 3 },
          pagination: { page: 1, pageSize: 12, nextPage: null },
          placeOptions: [],
        },
      })
    if (u.pathname === '/v1/link-preview')
      return r.fulfill({
        json: {
          title:
            'A useful report about public health transformation across several regencies with a readable compact preview',
          description: 'An excerpt should not dominate the mobile feed.',
          site: 'westpapua.watch',
          image: null,
        },
      })
    const result = await handler(
      new Request(q.url(), {
        method: q.method(),
        headers: {
          ...q.headers(),
          origin,
          ...(!guest ? { authorization: 'Bearer ' + owner.token } : {}),
        },
        ...(q.method() === 'POST' ? { body: q.postData() } : {}),
      }),
    )
    await r.fulfill({
      status: result.status,
      headers: Object.fromEntries(result.headers),
      body: Buffer.from(await result.arrayBuffer()),
    })
  })
  const go = async (path) => p.goto(origin + path, { waitUntil: 'networkidle' })
  await p.clock.install({ time: new Date('2026-11-03T20:59:59Z') }) // 05:59:59 device local.
  await go('/')
  assert.deepEqual(
    await p.evaluate(() => ({
      mode: document.documentElement.dataset.themeMode,
      theme: document.documentElement.dataset.commonsTheme,
      accent: JSON.parse(localStorage.getItem('strata.ui.appearance')).accent,
    })),
    { mode: 'clock', theme: 'dark', accent: '#1680fa' },
  )
  const before = await p
    .locator('body')
    .evaluate((e) => getComputedStyle(e).backgroundColor)
  await p.clock.fastForward(60001)

  assert.ok(
    await p.evaluate(() =>
      document.documentElement.hasAttribute('data-theme-shifting'),
    ),
  )
  assert.equal(
    await p
      .locator('body')
      .evaluate((e) => getComputedStyle(e).backgroundColor),
    before,
    'no immediate jump at schedule boundary',
  )
  await p.clock.fastForward(15000)
  const halfway = await p
    .locator('body')
    .evaluate((e) => getComputedStyle(e).backgroundColor)
  assert.notEqual(halfway, before)
  await p.clock.fastForward(16000)
  await p.waitForFunction(
    () =>
      document.documentElement.dataset.commonsTheme === 'light' &&
      !document.documentElement.hasAttribute('data-theme-shifting'),
  )
  assert.notEqual(
    await p
      .locator('body')
      .evaluate((e) => getComputedStyle(e).backgroundColor),
    halfway,
  )
  await p.getByRole('button', { name: 'Tema gelap', exact: true }).click()
  await p.clock.fastForward(13 * 3600000)
  assert.equal(
    await p.evaluate(() => document.documentElement.dataset.themeMode),
    'dark',
    'manual override survives schedule',
  )
  await p.clock.resume()
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 })
    for (const path of [
      '/',
      '/communities',
      '/groups',
      '/contexts',
      '/explore',
      '/news',
    ]) {
      await go(path)
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        path + ' overflow at ' + width,
      )
      if (width === 768)
        assert.equal(
          await p
            .locator('.etnos-sidebar .sidebar-settings > span')
            .isVisible(),
          false,
        )
      const theme = p.locator('.cx-topbar .theme-toggle')
      assert.ok(await theme.isVisible())
      const bounds = await theme.boundingBox()
      assert.ok(bounds.x + bounds.width <= width && bounds.x >= 0)
      assert.equal(
        await p
          .locator('.home-context,.feed-column,.home-layout-switch')
          .count(),
        0,
      )
    }
  }
  await p.setViewportSize({ width: 390, height: 844 })
  await go('/communities')
  await p
    .getByRole('heading', { name: 'Public institute', exact: true })
    .waitFor()
  assert.equal(
    await p.getByText('Hidden organisation name', { exact: true }).count(),
    0,
  )
  assert.equal(
    await p.getByText('Protected language recordings', { exact: true }).count(),
    0,
  )
  await p
    .locator('.community-directory')
    .getByText('Independent public room', { exact: true })
    .waitFor()
  await p.getByRole('combobox', { name: 'Organisasi komunitas' }).click()
  await p.getByRole('option', { name: 'Public institute', exact: true }).click()
  await p
    .locator('.community-directory')
    .getByText('Public stories', { exact: true })
    .waitFor()
  assert.equal(
    await p
      .locator('.community-directory')
      .getByText('Independent public room', { exact: true })
      .count(),
    0,
  )
  await p.keyboard.press('Escape')
  await p.getByRole('listbox').waitFor({ state: 'hidden' })
  await p.screenshot({
    animations: 'disabled',
    path: artifactDir + '/navigation-directory-390.png',
  })
  await go('/contexts')
  await p.getByRole('link', { name: /Jayapura/ }).waitFor()
  const filter = p.getByRole('combobox', { name: 'Jenis tempat dan konteks' })
  const search = p.getByRole('textbox', { name: 'Cari di direktori' })
  assert.ok((await filter.boundingBox()).y > (await search.boundingBox()).y)
  await p.screenshot({
    animations: 'disabled',
    path: artifactDir + '/navigation-places-390.png',
  })
  await go('/explore')
  await p.locator('.news-text-only').first().waitFor()
  assert.equal(await p.locator('.news-photo-credit').count(), 0)
  assert.equal(await p.locator('.news-grid img').count(), 0)
  assert.ok(
    await p
      .locator('.news-text-only')
      .first()
      .evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft) >= 20),
  )
  await p.screenshot({
    animations: 'disabled',
    path: artifactDir + '/navigation-news-fallback-390.png',
  })
  await go('/news')
  await p.locator('.news-desk-story:not(.has-photo)').first().waitFor()
  assert.equal(await p.locator('.news-desk-credit,.news-desk-photo').count(), 0)
  await go('/board')
  assert.equal(new URL(p.url()).pathname, '/')
  await p.getByRole('button', { name: 'Buka menu', exact: true }).click()
  const drawer = p.getByRole('dialog', { name: 'Navigasi' })
  await drawer.waitFor()
  await p.screenshot({
    animations: 'disabled',
    path: artifactDir + '/navigation-drawer-390.png',
  })
  const settings = drawer.getByRole('link', {
      name: 'Pengaturan',
      exact: true,
    }),
    signIn = drawer.getByRole('link', { name: 'Masuk', exact: true })
  assert.ok((await settings.boundingBox()).y < (await signIn.boundingBox()).y)
  assert.equal(
    await drawer.locator('[data-slot="sidebar-group-label"]').count(),
    0,
  )
  await p.keyboard.press('Escape')
  guest = false
  await go('/people/' + owner.actor.id)
  assert.equal(await p.locator('.profile-cover span').count(), 0)
  await p.locator('.profile-cover').waitFor()
  await go('/')
  await p.getByRole('button', { name: 'Posting', exact: true }).first().click()
  const composer = p.getByRole('dialog', { name: 'Posting baru' })
  assert.equal(
    await composer
      .getByRole('button', { name: 'Tutup komposer', exact: true })
      .count(),
    1,
  )
  assert.equal(
    await composer
      .getByRole('button', { name: 'Posting', exact: true })
      .count(),
    1,
  )
  await composer
    .getByRole('textbox', { name: 'Posting', exact: true })
    .fill('Synthetic draft, never posted.')
  assert.equal(
    await composer
      .getByRole('button', { name: 'Posting', exact: true })
      .isDisabled(),
    false,
  )
  await p.setViewportSize({ width: 390, height: 500 })
  const submit = await composer
    .getByRole('button', { name: 'Posting', exact: true })
    .boundingBox()
  assert.ok(submit.y >= 0 && submit.y + submit.height <= 500)
  await p.screenshot({
    animations: 'disabled',
    path: artifactDir + '/navigation-composer-keyboard-390.png',
  })
  await composer
    .getByRole('button', { name: 'Tutup komposer', exact: true })
    .click()
  await p.getByRole('button', { name: 'Buang draf', exact: true }).click()
  // Reduced motion reaches the scheduled palette directly; no prolonged animation.
  await p.emulateMedia({ reducedMotion: 'reduce' })
  await p.evaluate(() =>
    localStorage.setItem(
      'strata.ui.appearance',
      JSON.stringify({ themeMode: 'clock', theme: 'dark', accent: '#b9848a' }),
    ),
  )
  await p.clock.install({ time: new Date('2026-11-03T20:59:59Z') })
  await go('/')
  await p.clock.fastForward(60001)
  await p.waitForFunction(
    () => document.documentElement.dataset.commonsTheme === 'light',
  )
  assert.equal(
    await p.evaluate(() =>
      document.documentElement.hasAttribute('data-theme-shifting'),
    ),
    false,
  )
  assert.equal(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem('strata.ui.appearance')).accent,
    ),
    '#b9848a',
  )
  await p.evaluate(() =>
    localStorage.setItem(
      'strata.ui.appearance',
      JSON.stringify({ theme: 'dark', accent: '#6c9bab' }),
    ),
  )
  await p.reload({ waitUntil: 'networkidle' })
  assert.equal(
    await p.evaluate(() => document.documentElement.dataset.themeMode),
    'dark',
  )
  assert.equal(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem('strata.ui.appearance')).accent,
    ),
    '#6c9bab',
  )
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      productionWrites: 0,
      viewportChecks: 24,
      gradualTheme: true,
      reducedMotion: true,
      privateParentsHidden: true,
      photoFallback: true,
      browserErrors: errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
