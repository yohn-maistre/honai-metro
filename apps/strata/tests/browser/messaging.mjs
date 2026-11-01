import assert from 'node:assert/strict'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const s = new Strata(':memory:', origin),
  alice = s.provision('did:web:alice-fixture.example', 'Alice fixture'),
  bob = s.provision('did:web:bob-fixture.example', 'Bob fixture'),
  forum = s.createCommunity(
    alice.actor.id,
    'Synthetic square',
    'Isolated messaging contract',
    'public',
  ),
  handler = api(s),
  pass = 'Synthetic local passphrase only 2026'
s.setMember(alice.actor.id, forum.id, bob.actor.id, true)
s.createPost(alice.actor.id, forum.id, 'Synthetic Alice public contribution')
s.createPost(bob.actor.id, forum.id, 'Synthetic Bob public contribution')
const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  }),
  errors = [],
  requests = []
async function client(actor, width = 1280) {
  const context = await browser.newContext({
      viewport: { width, height: 900 },
    }),
    p = await context.newPage()
  p.on('pageerror', (e) => errors.push(e.message))
  await p.route('**/auth/me', (r) =>
    r.fulfill({
      json: { actor: actor.actor, csrf: 'fixture-only', steward: false },
    }),
  )
  await p.route('**/v1/**', async (r) => {
    const q = r.request()
    if (q.postData()) requests.push(q.postData())
    const response = await handler(
      new Request(q.url(), {
        method: q.method(),
        headers: {
          ...q.headers(),
          authorization: 'Bearer ' + actor.token,
          origin,
        },
        ...(q.method() === 'POST' ? { body: q.postData() } : {}),
      }),
    )
    await r.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    })
  })
  return p
}
async function setup(p) {
  await p.goto(origin + '/messages', { waitUntil: 'networkidle' })
  await p.getByLabel('Frasa kunci pesan', { exact: true }).fill(pass)
  await p.getByLabel('Ulangi frasa kunci', { exact: true }).fill(pass)
  await p.getByRole('checkbox').click()
  await p.getByRole('button', { name: 'Aktifkan pesan', exact: true }).click()
  await p
    .getByRole('heading', { name: 'Belum ada pesan', exact: true })
    .waitFor({ timeout: 30000 })
}
async function unlock(p) {
  if (
    await p.getByRole('button', { name: 'Buka pesan', exact: true }).count()
  ) {
    await p.getByLabel('Frasa kunci pesan', { exact: true }).fill(pass)
    await p.getByRole('button', { name: 'Buka pesan', exact: true }).click()
    await p.getByRole('button', { name: 'Kunci pesan', exact: true }).waitFor()
  }
}
try {
  const a = await client(alice),
    b = await client(bob, 390)
  await setup(a)
  await setup(b)
  await unlock(a)
  await a
    .getByRole('button', { name: 'Pesan baru', exact: true })
    .first()
    .click()
  await a.getByLabel('Nama pengguna', { exact: true }).fill('Bob')
  await a
    .getByRole('dialog')
    .getByRole('button', { name: 'Cari', exact: true })
    .click()
  await a
    .getByRole('dialog')
    .getByRole('button', { name: 'Kirim pesan ke Bob fixture', exact: true })
    .click()
  await a
    .getByText('Menunggu Bob fixture menerima permintaan.', { exact: true })
    .waitFor()
  await unlock(b)
  await b.getByRole('button', { name: 'Perbarui pesan', exact: true }).click()
  await b.getByRole('link', { name: /Alice fixture/ }).click()
  await b.getByRole('button', { name: 'Terima', exact: true }).click()
  await b.getByLabel('Tulis pesan', { exact: true }).waitFor()
  await unlock(a)
  await a.getByRole('button', { name: 'Perbarui pesan', exact: true }).click()
  await a
    .getByLabel('Tulis pesan', { exact: true })
    .fill('Private synthetic hello from Alice')
  await a.getByRole('button', { name: 'Kirim', exact: true }).click()
  await a
    .getByText('Private synthetic hello from Alice', { exact: true })
    .waitFor()
  await unlock(b)
  await b.getByRole('button', { name: 'Perbarui pesan', exact: true }).click()
  await b
    .getByText('Private synthetic hello from Alice', { exact: true })
    .waitFor()
  await b
    .getByLabel('Tulis pesan', { exact: true })
    .fill('Private synthetic reply from Bob')
  await b.getByRole('button', { name: 'Kirim', exact: true }).click()
  await b
    .getByText('Private synthetic reply from Bob', { exact: true })
    .waitFor()
  await unlock(a)
  await a.getByRole('button', { name: 'Perbarui pesan', exact: true }).click()
  await a
    .getByText('Private synthetic reply from Bob', { exact: true })
    .waitFor()
  await a.getByRole('button', { name: 'Opsi percakapan', exact: true }).click()
  await a.getByRole('menuitem', { name: 'Kode keamanan', exact: true }).click()
  const code = await a.locator('.dm-safety-code').innerText()
  await a
    .getByRole('dialog')
    .getByRole('button', { name: 'Tutup', exact: true })
    .click()
  assert.equal(s.all('SELECT * FROM dm_envelopes').length, 2)
  assert.equal(
    JSON.stringify(s.all('SELECT * FROM dm_envelopes')).includes(
      'Private synthetic',
    ),
    false,
  )
  assert.equal(
    requests.some((r) => r.includes(pass) || r.includes('Private synthetic')),
    false,
  )
  await b.getByRole('button', { name: 'Opsi percakapan', exact: true }).click()
  await b.getByRole('menuitem', { name: 'Kode keamanan', exact: true }).click()
  assert.equal(await b.locator('.dm-safety-code').innerText(), code)
  await b
    .getByRole('dialog')
    .getByRole('button', { name: 'Tutup', exact: true })
    .click()
  await b.getByRole('dialog').waitFor({ state: 'hidden' })
  await b.screenshot({
    path: artifactDir + '/strata-dm-mobile.png',
    fullPage: true,
  })
  assert.equal(
    await b.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  )
  await a.reload({ waitUntil: 'networkidle' })
  await a
    .getByLabel('Frasa kunci pesan', { exact: true })
    .fill('Wrong local passphrase 2026')
  await a.getByRole('button', { name: 'Buka pesan', exact: true }).click()
  await a.getByRole('alert').waitFor()
  await unlock(a)
  await a
    .getByText('Private synthetic reply from Bob', { exact: true })
    .waitFor()
  await b.getByRole('button', { name: 'Opsi percakapan', exact: true }).click()
  await b
    .getByRole('menuitem', { name: 'Blokir pengguna', exact: true })
    .click()
  await b
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Blokir', exact: true })
    .click()
  await b
    .getByText('Percakapan ditutup. Pesan baru tidak dapat dikirim.', {
      exact: true,
    })
    .waitFor()
  assert.equal(s.get('SELECT state FROM dm_threads').state, 'closed')
  assert.equal(s.all('SELECT * FROM dm_blocks').length, 1)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      realPublicWrites: 0,
      realBrowserMLSEncryption: true,
      twoIndependentBrowsers: true,
      messageRequestAccepted: true,
      bidirectional: true,
      noPlaintextInNetworkOrDatabase: true,
      matchingSafetyCodes: true,
      encryptedLocalPersistence: true,
      wrongPassphraseRejected: true,
      blocking: true,
      mobileOverflow: false,
      browserErrors: errors,
    }),
  )
} catch (e) {
  console.error(e)
  for (const p of browser.contexts().flatMap((c) => c.pages())) {
    console.error((await p.locator('body').innerText()).slice(-3500))
  }
  process.exitCode = 1
} finally {
  await browser.close()
  s.close()
}
