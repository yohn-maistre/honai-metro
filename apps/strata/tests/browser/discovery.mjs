import assert from 'node:assert/strict'
import {
  Strata,
  api,
  Groups,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:search-steward.example', 'giyaibo.bsky.social'),
  peer = s.provision('did:web:peer-search.example', 'Martha synthetic'),
  privatePeer = s.provision('did:web:private-search.example', 'Private only'),
  c = s.createCommunity(
    owner.actor.id,
    'Mee conversation',
    'Synthetic public language community',
    'public',
  ),
  h = s.createCommunity(
    privatePeer.actor.id,
    'Protected language room',
    'Synthetic private',
    'hidden-private',
  ),
  g = new Groups(s, { stewardDid: owner.actor.did })
s.setMember(owner.actor.id, c.id, peer.actor.id, true)
const old = s.createPost(peer.actor.id, c.id, 'An older conversation by Martha')
for (let i = 0; i < 34; i++)
  s.createPost(owner.actor.id, c.id, 'Synthetic public post ' + i)
s.createPost(privatePeer.actor.id, h.id, 'Not discoverable')
g.createContext(owner.actor.id, {
  slug: 'mee',
  title: 'Mee',
  kind: 'language',
  description: 'Synthetic language context; not a real community endorsement',
  language: 'id',
  aliases: ['Ekagi'],
})
const handler = api(s),
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    }),
    errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/auth/me', (r) =>
    r.fulfill({
      json: { actor: owner.actor, csrf: 'fixture-only', steward: true },
    }),
  )
  await page.route('**/v1/**', async (r) => {
    const q = r.request(),
      res = await handler(
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
    await r.fulfill({
      status: res.status,
      headers: Object.fromEntries(res.headers),
      body: Buffer.from(await res.arrayBuffer()),
    })
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Cari ETNOS', exact: true })
  await dialog.waitFor()
  const input = dialog.getByLabel('Cari ETNOS', { exact: true })
  await input.fill('GIYAIBO')
  await dialog.getByRole('option', { name: /giyaibo.bsky.social/ }).waitFor()
  assert.equal(
    await dialog.getByText('Private only', { exact: true }).count(),
    0,
  )
  await input.fill('Martha')
  await dialog
    .getByRole('option', { name: /Martha synthetic/ })
    .first()
    .waitFor()
  await page.screenshot({ path: artifactDir + '/alpha-search-desktop.png' })
  await dialog.getByRole('button', { name: 'Orang', exact: true }).click()
  await input.focus()
  await input.press('ArrowDown')
  await input.press('Enter')
  await page.waitForURL('**/people/' + peer.actor.id)
  await page
    .getByText('An older conversation by Martha', { exact: true })
    .waitFor()
  await page.getByRole('button', { name: 'Ikuti', exact: true }).click()
  await page.getByRole('button', { name: 'Mengikuti', exact: true }).waitFor()
  await page.screenshot({ path: artifactDir + '/alpha-profile-desktop.png' })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Pilih linimasa', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Mengikuti', exact: true }).click()
  await page
    .getByText('An older conversation by Martha', { exact: true })
    .waitFor()
  assert.equal(
    await page.getByText('Synthetic public post 0', { exact: true }).count(),
    0,
  )
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
    await page
      .getByRole('heading', { name: 'Tempat & bahasa', exact: true })
      .waitFor()
    await page.screenshot({
      path: artifactDir + `/alpha-explore-${width}.png`,
      fullPage: true,
    })
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    )
    await page
      .getByRole('button', { name: 'Buka pencarian', exact: true })
      .click()
    await dialog.waitFor()
    await input.fill('Mee')
    await dialog.getByRole('option', { name: /Mee conversation/ }).waitFor()
    const box = await dialog.boundingBox()
    assert.ok(
      box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= width + 1 &&
        box.y + box.height <= 900,
      'Search dialog must stay inside the viewport',
    )
    assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Search dialog content must fit its own width')
    await page.screenshot({ path: artifactDir + `/alpha-search-${width}.png` })
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    )
    await input.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(
      await page
        .getByRole('button', { name: 'Buka pencarian', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    )
  }
  await page.goto(origin + '/find?q=giyaibo', { waitUntil: 'networkidle' })
  await page
    .getByRole('link', { name: /giyaibo.bsky.social/ })
    .first()
    .waitFor()
  await page.getByRole('button', { name: 'Orang', exact: true }).click()
  await page
    .getByRole('link', { name: /giyaibo.bsky.social/ })
    .first()
    .waitFor()
  await page.screenshot({ path: artifactDir + '/alpha-search-page-mobile.png' })
  await page.goto(origin + '/preferences', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Terang', exact: true }).click()
  await page.getByRole('button', { name: 'Kertas', exact: true }).click()
  await page.getByRole('button', { name: 'Serat', exact: true }).click()
  await page.screenshot({
    path: artifactDir + '/alpha-settings-paper.png',
    fullPage: true,
  })
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.base),
    'paper',
  )
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.texture),
    'grain',
  )
  await page.getByRole('button', { name: 'Gelap', exact: true }).click()
  await page.getByRole('button', { name: 'Tinta', exact: true }).click()
  await page.getByRole('button', { name: 'Dither', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: artifactDir + '/alpha-settings-ink-mobile.png',
    fullPage: true,
  })
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  )
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      realPublicWrites: 0,
      searchOwnIdentity: true,
      profileOutsideFirstPage: true,
      keyboardSelection: true,
      focusRestored: true,
      followingFeed: true,
      baseTexturePersistence: true,
      widths: [390, 768, 1440],
    }),
  )
} finally {
  await browser.close()
  s.close()
}
