import assert from 'node:assert/strict'

import { Strata, api, chromium, origin } from './environment.mjs'

const s = new Strata(':memory:', origin)
const owner = s.provision(
  'did:web:browser-fixture.example',
  'Synthetic steward',
)
s.createCommunity(
  owner.actor.id,
  'Synthetic test community',
  'Browser contract fixture only',
  'public',
)
const handler = api(s)
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
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
      headers = {
        ...q.headers(),
        authorization: 'Bearer ' + owner.token,
        origin,
      }
    const response = await handler(
      new Request(q.url(), {
        method: q.method(),
        headers,
        ...(q.method() === 'POST' ? { body: q.postData() } : {}),
      }),
    )
    await r.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    })
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Posting', exact: true })
    .first()
    .click()
  await page
    .getByRole('dialog', { name: 'Posting baru' })
    .getByLabel('Posting', { exact: true })
    .fill('Synthetic browser contribution')
  await page
    .getByRole('dialog', { name: 'Posting baru' })
    .getByRole('button', { name: 'Posting', exact: true })
    .click()
  await page
    .getByText('Synthetic browser contribution', { exact: true })
    .waitFor()
  const root = s.feed()[0]
  assert.equal(root.text, 'Synthetic browser contribution')
  await page
    .getByPlaceholder('Tulis balasan…')
    .fill('Synthetic nested discussion')
  await page.getByRole('button', { name: 'Balas', exact: true }).click()
  await page.getByText('Synthetic nested discussion', { exact: true }).waitFor()
  assert.equal(s.getPost(owner.actor.id, root.id).replies, 1)
  await page
    .getByRole('button', { name: 'Dukung posting', exact: true })
    .first()
    .click()
  await page.waitForTimeout(150)
  assert.equal(s.getPost(owner.actor.id, root.id).score, 1)
  await page
    .getByRole('button', { name: 'Simpan posting', exact: true })
    .first()
    .click()
  await page.getByRole('link', { name: 'Tersimpan', exact: true }).click()
  await page
    .getByText('Synthetic browser contribution', { exact: true })
    .waitFor()
  await page.getByRole('link', { name: 'Wiki', exact: true }).first().click()
  await page.getByRole('button', { name: 'Halaman', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Nama', { exact: true })
    .fill('Synthetic reviewed knowledge')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Buat', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'Synthetic reviewed knowledge', exact: true })
    .waitFor()
  await page
    .getByRole('button', { name: 'Usulkan perubahan', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByLabel('Isi revisi', { exact: true })
    .fill('Synthetic evidence-backed result')
  await page
    .getByRole('dialog')
    .getByLabel('Perspektif / atribusi', { exact: true })
    .fill('Synthetic fixture')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ajukan untuk tinjauan', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Terima revisi', exact: true })
    .waitFor()
  await page.getByRole('button', { name: 'Terima revisi', exact: true }).click()
  await page.waitForTimeout(200)
  assert.equal(s.get('SELECT count(*) AS n FROM wiki_revisions').n, 1)
  await page.goto(
    origin + '/communities/' + s.get('SELECT id FROM communities LIMIT 1').id,
    { waitUntil: 'networkidle' },
  )
  await page.getByRole('tab', { name: 'Tentang', exact: true }).click()
  await page.getByRole('tabpanel').waitFor()
  assert.equal(
    await page
      .getByRole('tab', { name: 'Tentang', exact: true })
      .getAttribute('aria-selected'),
    'true',
  )
  await page
    .getByRole('tab', { name: 'Tentang', exact: true })
    .press('ArrowLeft')
  assert.equal(
    await page
      .getByRole('tab', { name: 'Wiki', exact: true })
      .getAttribute('aria-selected'),
    'true',
  )
  assert.equal(await page.getByRole('tabpanel').count(), 1)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      realPublicWrites: 0,
      posted: true,
      replied: true,
      voted: true,
      bookmarked: true,
      wikiCreated: true,
      proposalAccepted: true,
      browserErrors: errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
