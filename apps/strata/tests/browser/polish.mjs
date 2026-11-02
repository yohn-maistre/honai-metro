import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:polish-fixture.example', 'Synthetic reader'),
  c = s.createCommunity(
    owner.actor.id,
    'Mee fixture',
    'Synthetic room',
    'public',
  ),
  post = s.createPost(owner.actor.id, c.id, 'Synthetic conversation for layout')
const handler = api(s),
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
try {
  const context = await browser.newContext({
      hasTouch: true,
      acceptDownloads: true,
    }),
    page = await context.newPage(),
    errors = []
  page.setDefaultTimeout(15000)
  page.on('pageerror', (e) => errors.push(e.message))
  let feedRequests = 0,
    delayWiki = false
  await page.route('**/auth/me', (r) =>
    r.fulfill({ json: { actor: owner.actor, csrf: 'fixture', steward: true } }),
  )
  await page.route('**/v1/**', async (r) => {
    const req = r.request(),
      url = new URL(req.url())
    if (url.pathname === '/v1/news')
      return r.fulfill({
        json: {
          source: {
            name: 'West Papua Watch',
            url: 'https://westpapua.watch/news/',
          },
          available: true,
          items: Array.from({ length: 5 }, (_, i) => ({
            id: String(i),
            title: 'Synthetic news headline ' + i,
            url: 'https://westpapua.watch/story/?id=' + i,
            publishedAt: '2026-11-01T10:00:00Z',
            sourceCount: 2,
          })),
        },
      })
    if (url.pathname === '/v1/feed/page') feedRequests++
    if (delayWiki && url.pathname === '/v1/wiki')
      await new Promise((resolve) => setTimeout(resolve, 500))
    const res = await handler(
      new Request(req.url(), {
        method: req.method(),
        headers: {
          ...req.headers(),
          authorization: 'Bearer ' + owner.token,
          origin,
        },
        ...(req.method() === 'POST' ? { body: req.postData() } : {}),
      }),
    )
    await r.fulfill({
      status: res.status,
      headers: Object.fromEntries(res.headers),
      body: Buffer.from(await res.arrayBuffer()),
    })
  })
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
    await page
      .locator('main .news-section')
      .getByText('Synthetic news headline 0', { exact: true })
      .waitFor()
    assert.equal(await page.locator('main .discovery-search').count(), 0)
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    )
    await page.screenshot({
      path: `${artifactDir}/polish-explore-${width}.png`,
      fullPage: true,
    })
    await page
      .getByRole('button', { name: 'Buka pencarian', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: 'Cari ETNOS', exact: true })
      .getByLabel('Cari ETNOS', { exact: true })
      .fill('Synthetic')
    await page
      .getByRole('option', { name: /Synthetic reader/ })
      .first()
      .waitFor()
    await page.screenshot({ path: `${artifactDir}/polish-search-${width}.png` })
    await page.keyboard.press('Escape')
  }
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(origin + '/square/' + post.id, { waitUntil: 'networkidle' })
  const trigger = page.getByLabel('Urutkan balasan', { exact: true }),
    bounds = await trigger.boundingBox()
  assert.ok(bounds.width < 150)
  await page.getByPlaceholder('Tulis balasan…').focus()
  assert.equal(
    await page
      .getByPlaceholder('Tulis balasan…')
      .evaluate((el) => getComputedStyle(el).borderBottomWidth),
    '0px',
  )
  await page.screenshot({ path: artifactDir + '/polish-thread-390.png' })
  await page.goto(origin, { waitUntil: 'networkidle' })
  const before = feedRequests
  await page
    .getByText('Synthetic conversation for layout', { exact: true })
    .dispatchEvent('touchstart', {
      touches: [{ identifier: 1, clientX: 200, clientY: 100 }],
      bubbles: true,
    })
  await page.evaluate(() =>
    window.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [
          new Touch({
            identifier: 1,
            target: document.body,
            clientX: 200,
            clientY: 260,
          }),
        ],
        cancelable: true,
      }),
    ),
  )
  await page
    .getByRole('status', { name: 'Lepaskan untuk memuat ulang' })
    .waitFor()
  await page.evaluate(() =>
    window.dispatchEvent(new TouchEvent('touchend', { touches: [] })),
  )
  await page.waitForTimeout(300)
  assert.equal(feedRequests, before + 1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  delayWiki = true
  await page.goto(origin + '/wiki', { waitUntil: 'domcontentloaded' })
  await page.locator('.app-load-line').waitFor()
  assert.equal(
    await page.getByText('Belum ada halaman', { exact: true }).count(),
    0,
  )
  assert.equal(
    await page
      .locator('.app-load-line i')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
    'none',
  )
  await page.getByText('Belum ada halaman', { exact: true }).waitFor()
  delayWiki = false
  await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
  // Origin transfer uses a separate, intercepted legacy page. No requests reach a live deployment.
  const legacy = await context.newPage()
  await legacy.route(
    'https://strata-preview.giyaibo.workers.dev/**',
    async (r) => {
      const u = new URL(r.request().url())
      const res = await r.fetch({ url: origin + u.pathname + u.search })
      await r.fulfill({ response: res })
    },
  )
  await legacy.goto(
    'https://strata-preview.giyaibo.workers.dev/recover-messages',
    { waitUntil: 'networkidle' },
  )
  const passphrase = 'Synthetic secret passphrase for origin move'
  await legacy.evaluate(
    async ({ id, passphrase }) => {
      const enc = new TextEncoder(),
        b64 = (a) => btoa(String.fromCharCode(...a)),
        salt = crypto.getRandomValues(new Uint8Array(16)),
        iv = crypto.getRandomValues(new Uint8Array(12)),
        material = await crypto.subtle.importKey(
          'raw',
          enc.encode(passphrase),
          'PBKDF2',
          false,
          ['deriveKey'],
        ),
        key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 },
          material,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt'],
        ),
        value = {
          actorId: id,
          deviceId: 'synthetic-origin-device',
          pair: { privateKey: 'AQI', publicKey: 'AQI' },
          packages: {},
          threads: {},
        },
        ciphertext = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv,
            additionalData: enc.encode(
              'strata.dm.vault.v1:' + location.origin + ':' + id,
            ),
          },
          key,
          enc.encode(JSON.stringify(value)),
        )
      await new Promise((resolve, reject) => {
        const r = indexedDB.open('honai-dm-v1', 1)
        r.onupgradeneeded = () => r.result.createObjectStore('vaults')
        r.onsuccess = () => {
          const t = r.result.transaction('vaults', 'readwrite')
          t.objectStore('vaults').put(
            {
              version: 1,
              salt: b64(salt),
              iv: b64(iv),
              ciphertext: b64(new Uint8Array(ciphertext)),
            },
            id,
          )
          t.oncomplete = () => {
            r.result.close()
            resolve()
          }
          t.onerror = reject
        }
      })
    },
    { id: owner.actor.id, passphrase },
  )
  await legacy.reload({ waitUntil: 'networkidle' })
  const downloading = legacy.waitForEvent('download')
  await legacy
    .getByRole('button', { name: 'Unduh cadangan terenkripsi' })
    .click()
  const downloaded = await downloading,
    text = await readFile(await downloaded.path(), 'utf8')
  assert.ok(!text.includes('synthetic-origin-device'))
  assert.equal(
    JSON.parse(text).origin,
    'https://strata-preview.giyaibo.workers.dev',
  )
  await page.goto(origin + '/preferences', { waitUntil: 'networkidle' })
  await page.getByText('Pulihkan dari browser lama', { exact: true }).click()
  await page.getByLabel('Cadangan terenkripsi', { exact: true }).setInputFiles({
    name: 'encrypted.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  })
  await page
    .getByLabel('Frasa sandi pesan', { exact: true })
    .fill('incorrect passphrase')
  await page
    .getByRole('button', { name: 'Pulihkan kunci', exact: true })
    .click()
  await page
    .getByText('Frasa sandi tidak cocok atau cadangan rusak.', { exact: true })
    .waitFor()
  await page.getByLabel('Frasa sandi pesan', { exact: true }).fill(passphrase)
  await page
    .getByRole('button', { name: 'Pulihkan kunci', exact: true })
    .click()
  await page
    .getByText('Kunci dipulihkan. Buka Pesan untuk melanjutkan.', {
      exact: true,
    })
    .waitFor()
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      news: true,
      searchConsolidated: true,
      compactSort: true,
      pullRefresh: true,
      encryptedOriginTransfer: true,
      wrongPassphraseRejected: true,
      browserErrors: errors,
    }),
  )
  await context.close()
} finally {
  await browser.close()
  s.close()
}
