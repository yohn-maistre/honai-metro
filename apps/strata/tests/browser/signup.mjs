// Actual BrowserAuth + official OAuth SDK; provider/account creation is synthetic.
// Loopback only. No deployed identities, accounts, posts or credentials.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const {
  fixture,
  did,
  origin: authOrigin,
  issuer,
} = await import(
  pathToFileURL(resolve(process.env.STRATA_REPO, 'test/oauth-fixture.ts'))
)
const s = new Strata(':memory:', authOrigin),
  owner = s.provision(did, 'Synthetic steward'),
  newDid = 'did:plc:zzzzzzzzzzzzzzzzzzzzzzzz'
const room = s.createCommunity(
  owner.actor.id,
  'Percakapan terbuka',
  'Public fixture.',
  'public',
  false,
  'open',
)
s.createPost(owner.actor.id, room.id, 'Synthetic conversation for refresh')
const f = await fixture(
  s,
  { enrollmentMode: 'open' },
  newDid,
  'friend.bsky.social',
  newDid,
)
const handler = api(s, {
  authMode: 'atproto',
  principal: (r) => f.auth.principal(r),
  writeGuard: (r) => f.auth.writeGuard(r),
})
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
let blockFeed = false,
  releaseFeed,
  feedCalls = 0,
  starts = []
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    hasTouch: true,
  })
  const p = await context.newPage(),
    errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.route('**/auth/**', async (route) => {
    const q = route.request(),
      u = new URL(q.url())
    if (u.pathname === '/auth/start') starts.push(JSON.parse(q.postData()))
    const request = new Request(authOrigin + u.pathname + u.search, {
      method: q.method(),
      headers: { ...q.headers(), origin: authOrigin },
      ...(q.method() === 'POST' ? { body: q.postData() } : {}),
    })
    const response = await f.auth.route(request)
    // Preserve individual Set-Cookie headers (Node Headers iteration folds them).
    await route.fulfill({
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'set-cookie': response.headers.getSetCookie().join('\n'),
      },
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await p.route('**/v1/**', async (route) => {
    const q = route.request(),
      u = new URL(q.url())
    if (u.pathname === '/v1/news')
      return route.fulfill({
        json: {
          available: true,
          items: [],
          pagination: { page: 1, nextPage: null },
          placeOptions: [],
        },
      })
    if (u.pathname === '/v1/feed/page') {
      feedCalls++
      if (blockFeed)
        await new Promise((resolve) => {
          releaseFeed = resolve
        })
    }
    const response = await handler(
      new Request(authOrigin + u.pathname + u.search, {
        method: q.method(),
        headers: { ...q.headers(), origin: authOrigin },
        ...(q.method() === 'POST' ? { body: q.postData() } : {}),
      }),
    )
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await p.route(issuer + '/**', async (route) => {
    const back =
      origin +
      '/auth/callback?state=' +
      f.state() +
      '&code=fixture&iss=' +
      encodeURIComponent(issuer)
    await route.fulfill({
      contentType: 'text/html',
      body:
        '<!doctype html><html><body><h1>Simulated Bluesky account setup</h1><p>This fixture represents provider-owned account creation and approval.</p><a href="' +
        back +
        '">Create test account and authorize</a></body></html>',
    })
  })
  const go = (path) => p.goto(origin + path, { waitUntil: 'networkidle' })
  await go(
    '/login?mode=signup&returnTo=' +
      encodeURIComponent('/communities?welcome=1'),
  )
  await p.getByRole('button', { name: 'Lanjutkan dengan Bluesky' }).waitFor()
  assert.equal(await p.getByLabel('Handle akun').count(), 0)
  assert.equal(await p.getByLabel('Kode undangan ETNOS').count(), 0)
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 })
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
  }
  await p.setViewportSize({ width: 390, height: 900 })
  await p.screenshot({ path: artifactDir + '/signup-390.png' })
  await p.getByRole('button', { name: 'Lanjutkan dengan Bluesky' }).click()
  await p.waitForURL(issuer + '/**')
  assert.equal(starts[0].mode, 'signup')
  assert.equal(starts[0].handle, undefined)
  assert.equal(f.parameters().has('login_hint'), false)
  await p
    .getByRole('link', { name: 'Create test account and authorize' })
    .click()
  await p.waitForURL('**/communities?welcome=1')
  await p
    .getByText('Selamat datang, friend.bsky.social', { exact: true })
    .waitFor()
  assert.equal(
    s.all('SELECT * FROM enrollment_allowlist WHERE did=?', newDid).length,
    1,
  )
  const person = s.get('SELECT * FROM actors WHERE did=?', newDid)
  assert.equal(
    s.all('SELECT * FROM memberships WHERE actor_id=?', person.id).length,
    0,
  )
  await p.screenshot({ path: artifactDir + '/signup-return-390.png' })
  await go('/login')
  await p.getByLabel('Handle akun').fill('friend.bsky.social')
  await p.getByRole('button', { name: 'Lanjutkan', exact: true }).click()
  await p.waitForURL(issuer + '/**')
  assert.equal(starts.at(-1).mode, 'login')
  await p
    .getByRole('link', { name: 'Create test account and authorize' })
    .click()
  await p.waitForURL(origin + '/')
  await p
    .getByText('Synthetic conversation for refresh', { exact: true })
    .waitFor()
  const touch = async (dx, dy) => {
    await p
      .getByText('Synthetic conversation for refresh', { exact: true })
      .dispatchEvent('touchstart', {
        touches: [{ identifier: 1, clientX: 160, clientY: 100 }],
        bubbles: true,
      })
    await p.evaluate(
      ({ dx, dy }) =>
        window.dispatchEvent(
          new TouchEvent('touchmove', {
            touches: [
              new Touch({
                identifier: 1,
                target: document.body,
                clientX: 160 + dx,
                clientY: 100 + dy,
              }),
            ],
            cancelable: true,
          }),
        ),
      { dx, dy },
    )
  }
  await touch(120, 10)
  assert.equal(await p.locator('.pull-refresh').count(), 0)
  await p.evaluate(() =>
    window.dispatchEvent(new TouchEvent('touchend', { touches: [] })),
  )
  blockFeed = true
  await touch(0, 160)
  await p.locator('.pull-refresh[data-state="ready"]').waitFor()
  await p.screenshot({ path: artifactDir + '/sandpile-pull-390.png' })
  const before = feedCalls
  await p.evaluate(() =>
    window.dispatchEvent(new TouchEvent('touchend', { touches: [] })),
  )
  await p.locator('.refresh-sandpile[data-motion="falling"]').waitFor()
  await p.waitForFunction(
    () =>
      document.querySelector('.pull-refresh')?.dataset.state === 'refreshing',
  )
  const frame = await p.locator('.refresh-sandpile').innerHTML()
  await p.waitForTimeout(300)
  assert.notEqual(await p.locator('.refresh-sandpile').innerHTML(), frame)
  await p.screenshot({ path: artifactDir + '/sandpile-falling-390.png' })
  // Switching the accessibility preference during an active request stops motion.
  await p.emulateMedia({ reducedMotion: 'reduce' })
  await p.locator('.refresh-sandpile[data-motion="still"]').waitFor()
  const still = await p.locator('.refresh-sandpile').innerHTML()
  await p.waitForTimeout(200)
  assert.equal(await p.locator('.refresh-sandpile').innerHTML(), still)
  assert.equal(feedCalls, before + 1)
  blockFeed = false
  releaseFeed()
  await p.locator('.pull-refresh').waitFor({ state: 'detached' })
  assert.equal(await p.locator('.refresh-sandpile').count(), 0)
  await p.emulateMedia({ reducedMotion: 'no-preference' })
  // The same refresh action remains keyboard accessible without a gesture.
  await p.setViewportSize({ width: 1440, height: 900 })
  await p.getByRole('button', { name: 'Muat ulang', exact: true }).focus()
  await p.keyboard.press('Enter')
  await p.waitForTimeout(150)
  assert.equal(feedCalls, before + 2)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      signupReturn: true,
      existingLogin: true,
      zeroMemberships: true,
      widths: [320, 390, 768, 1440],
      sandpile: true,
      reducedMotion: true,
      keyboardRefresh: true,
    }),
  )
  await context.close()
} finally {
  releaseFeed?.()
  await browser.close()
  s.close()
}
