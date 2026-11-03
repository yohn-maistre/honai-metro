import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import {
  Strata,
  Groups,
  api,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:agent-ui.example', 'Synthetic operator'),
  room = s.createCommunity(
    owner.actor.id,
    'Public agent room',
    'Test',
    'public',
    true,
    'open',
  ),
  hidden = s.createCommunity(
    owner.actor.id,
    'Protected language community',
    'PRIVATE_CULTURAL_MARKER',
    'hidden-private',
  ),
  handler = api(s)
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/auth/me', (r) =>
    r.fulfill({
      json: { actor: owner.actor, csrf: 'fixture', steward: false },
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
    return r.fulfill({
      status: res.status,
      headers: Object.fromEntries(res.headers),
      body: Buffer.from(await res.arrayBuffer()),
    })
  })
  await page.goto(origin + '/agents', { waitUntil: 'networkidle' })
  await page.locator('.agent-register summary').click()
  await page.getByLabel('Nama agen', { exact: true }).fill('Synthetic Muse')
  assert.ok(
    !(await page
      .getByRole('combobox', { name: 'Komunitas agen' })
      .innerText()
      .then((t) => t.includes('Protected'))),
  )
  await page.getByRole('button', { name: 'Daftarkan', exact: true }).click()
  await page
    .locator('.agent-entry h2')
    .filter({ hasText: 'Synthetic Muse' })
    .waitFor()
  const entry = page.locator('.agent-entry').first()
  await entry
    .getByRole('button', { name: 'Terima sebagai anggota', exact: true })
    .click()
  await entry.getByText('Anggota komunitas', { exact: true }).waitFor()
  await entry
    .locator('summary')
    .filter({ hasText: 'Perangkat & koneksi' })
    .click()
  await entry
    .getByLabel('Nama perangkat', { exact: true })
    .fill('Synthetic laptop')
  const keys = generateKeyPairSync('ed25519')
  await entry
    .getByLabel('Kunci publik (JWK)', { exact: true })
    .fill(JSON.stringify(keys.publicKey.export({ format: 'jwk' })))
  await entry
    .getByRole('button', { name: 'Daftarkan perangkat', exact: true })
    .click()
  await page.getByText('Konfigurasi koneksi', { exact: true }).waitFor()
  await entry
    .locator('summary')
    .filter({ hasText: 'Mandat menulis & editorial' })
    .click()
  await entry
    .getByLabel('Tujuan mandat', { exact: true })
    .fill('Test one community')
  await entry
    .getByRole('button', { name: 'Izinkan posting', exact: true })
    .click()
  await entry
    .getByText('Posting · Test one community', { exact: true })
    .waitFor()
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(100)
    await page.screenshot({
      path: artifactDir + '/agents-' + width + '.png',
      fullPage: true,
    })
  }
  await entry.getByRole('button', { name: 'Jeda agen', exact: true }).click()
  await entry.getByText('Dijeda', { exact: true }).waitFor()
  assert.equal(s.get('SELECT count(*) n FROM agent_tokens').n, 0)
  assert.equal(
    s.get('SELECT count(*) n FROM agent_deployments WHERE revoked=0').n,
    0,
  )
  assert.equal(s.get('SELECT count(*) n FROM mandates WHERE revoked=0').n, 0)
  await entry
    .getByRole('button', { name: 'Aktifkan kembali', exact: true })
    .click()
  await entry
    .locator('summary')
    .filter({ hasText: 'Perangkat & koneksi' })
    .waitFor()
  assert.equal(
    s.get('SELECT count(*) n FROM agent_deployments WHERE revoked=0').n,
    0,
    'resume never revives old keys',
  )
  const raw = await page.content()
  assert.ok(!raw.includes('PRIVATE_CULTURAL_MARKER'))
  assert.deepEqual(errors, [])
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: artifactDir + '/agents-final-1440.png' })
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      realPublicWrites: 0,
      registration: true,
      privateSpaceNotOffered: true,
      publicKeyOnly: true,
      admission: true,
      separateMandate: true,
      suspendRevokes: true,
      resumeNeedsNewKey: true,
      widths: [390, 768, 1440],
      errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
