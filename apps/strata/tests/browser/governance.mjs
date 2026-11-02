import assert from 'node:assert/strict'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
import { Groups } from './environment.mjs'
import { Activity } from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:synthetic-steward.example', 'Synthetic steward'),
  other = s.provision(
    'did:web:synthetic-participant.example',
    'Synthetic participant',
  ),
  handler = api(s, { stewardDid: owner.actor.did })
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 940 } }),
    errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.route('**/auth/me', (r) =>
    r.fulfill({
      json: { actor: owner.actor, csrf: 'fixture-only', steward: true },
    }),
  )
  await p.route('**/v1/**', async (r) => {
    const q = r.request(),
      response = await handler(
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
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await p.goto(origin + '/groups', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: 'Buat', exact: true }).click()
  let dialog = p.getByRole('dialog')
  await dialog
    .getByLabel('Nama', { exact: true })
    .fill('Synthetic regional institute')
  await dialog
    .getByLabel('Deskripsi', { exact: true })
    .fill('Isolated test institution; never deployed as real data.')
  await dialog.getByRole('button', { name: 'Buat', exact: true }).click()
  await p
    .getByRole('heading', { name: 'Synthetic regional institute', exact: true })
    .waitFor()
  await p.getByRole('button', { name: 'Ruang', exact: true }).click()
  await dialog
    .getByLabel('Nama', { exact: true })
    .fill('Synthetic public space')
  await dialog
    .getByLabel('Deskripsi', { exact: true })
    .fill('Test conversation only')
  await dialog.getByRole('button', { name: 'Buat', exact: true }).click()
  await p
    .getByRole('link', { name: 'Synthetic public space', exact: true })
    .waitFor()
  const g = s.get('SELECT * FROM groups'),
    space = s.get('SELECT * FROM communities')
  assert.equal(s.all('SELECT * FROM spaces').length, 1)
  s.setMember(owner.actor.id, space.id, other.actor.id, true)
  s.createPost(other.actor.id, space.id, 'Synthetic participant introduction')
  await p.getByRole('button', { name: 'Kelola anggota', exact: true }).click()
  await dialog
    .getByLabel('Cari pengguna', { exact: true })
    .fill('Synthetic participant')
  await dialog
    .getByRole('button', { name: 'Cari pengguna', exact: true })
    .click()
  await dialog
    .getByRole('button', { name: 'Pilih Synthetic participant', exact: true })
    .click()
  await dialog
    .getByRole('button', { name: 'Tambahkan anggota', exact: true })
    .click()
  await p.waitForTimeout(100)
  assert.equal(
    s.get(
      'SELECT role FROM group_members WHERE group_id=? AND actor_id=?',
      g.id,
      other.actor.id,
    ).role,
    'member',
  )
  await dialog.getByRole('button', { name: 'Tutup', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })

  await p
    .getByRole('button', { name: 'Ajukan sebagai sponsor', exact: true })
    .click()
  await p.getByRole('button', { name: 'Setujui sponsor', exact: true }).click()
  await p.getByRole('button', { name: 'Kerja publik', exact: true }).waitFor()
  assert.equal(new Groups(s).group(g.id).sponsorship, 'enabled')
  await p.getByRole('button', { name: 'Kerja publik', exact: true }).click()
  await dialog
    .getByLabel('Nama', { exact: true })
    .fill('Synthetic river monitoring')
  await dialog
    .getByLabel('Deskripsi', { exact: true })
    .fill('Public test scope, no private source.')
  await dialog.getByRole('button', { name: 'Buat', exact: true }).click()
  await p
    .getByRole('heading', { name: 'Synthetic river monitoring', exact: true })
    .waitFor()
  await p.getByRole('button', { name: 'Mulai kerja', exact: true }).click()
  await p.getByText('Berjalan', { exact: true }).waitFor()
  await p.getByRole('button', { name: 'Usulkan hasil', exact: true }).click()
  await dialog
    .getByLabel('Isi hasil', { exact: true })
    .fill('Synthetic reviewed result')
  await dialog
    .getByRole('button', { name: 'Ajukan untuk tinjauan', exact: true })
    .click()
  await p.getByRole('button', { name: 'Terima hasil', exact: true }).click()
  await p
    .getByRole('heading', { name: 'Hasil diterima', exact: true })
    .waitFor()
  assert.equal(s.get('SELECT state FROM public_work').state, 'completed')
  await p.screenshot({
    path: artifactDir + '/strata-populated-work-desktop.png',
    fullPage: true,
  })
  const context = new Groups(s, { stewardDid: owner.actor.did }).createContext(
    owner.actor.id,
    {
      slug: 'synthetic-region',
      title: 'Synthetic region',
      description: 'Isolated discovery fixture',
      kind: 'region',
      language: 'id',
      aliases: [],
    },
  )
  s.setMember(owner.actor.id, space.id, other.actor.id, true)
  const root = s.createPost(
    owner.actor.id,
    space.id,
    'Synthetic public conversation',
  )
  s.createPost(other.actor.id, space.id, 'Synthetic reply', root.id)
  new Groups(s).attach(owner.actor.id, 'post', root.id, context.id)
  await p.goto(origin + '/contexts/synthetic-region', {
    waitUntil: 'networkidle',
  })
  await p.getByText('Synthetic public conversation', { exact: true }).waitFor()
  assert.equal(
    await p
      .getByRole('heading', { name: 'Synthetic region', exact: true })
      .count(),
    1,
  )
  await p.goto(origin + '/notifications', { waitUntil: 'networkidle' })
  await p.getByText('Balasan baru', { exact: true }).waitFor()
  await p
    .getByRole('button', { name: 'Tandai semua dibaca', exact: true })
    .click()
  assert.equal(new Activity(s).list(owner.actor.id).unread, 0)
  await p.goto(origin + '/preferences', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: 'Daun', exact: true }).click()
  assert.equal(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem('strata.ui.appearance')).accent,
    ),
    '#7b9287',
  )
  await p.getByRole('button', { name: 'Terang', exact: true }).click()
  assert.equal(
    await p.evaluate(() => document.documentElement.classList.contains('dark')),
    false,
  )
  await p.getByLabel('Warna sendiri', { exact: true }).fill('#000001')
  await p.getByRole('button', { name: 'Terapkan', exact: true }).click()
  await p.reload({ waitUntil: 'networkidle' })
  assert.equal(
    await p.getByLabel('Warna sendiri', { exact: true }).inputValue(),
    '#000001',
  )
  await p.getByLabel('Warna sendiri', { exact: true }).fill('invalid')
  await p.getByRole('button', { name: 'Terapkan', exact: true }).click()
  await p.getByRole('alert').waitFor()
  await p.getByRole('button', { name: 'Abstraksi', exact: true }).click()
  await p.screenshot({
    path: artifactDir + '/strata-preferences-light-desktop.png',
    fullPage: true,
  })
  await p.setViewportSize({ width: 390, height: 844 })
  await p.goto(origin + '/groups/' + g.id, { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: 'Kelola anggota', exact: true }).waitFor()
  await p.screenshot({
    path: artifactDir + '/strata-populated-group-mobile.png',
    fullPage: true,
  })
  await p
    .getByRole('button', { name: 'Semua ruang', exact: true })
    .last()
    .click()
  await p.getByRole('dialog', { name: 'Navigasi', exact: true }).waitFor()
  await p
    .getByRole('dialog')
    .getByRole('link', { name: 'Aktivitas', exact: true })
    .click()
  await p.getByRole('heading', { name: 'Aktivitas', exact: true }).waitFor()
  await p.getByRole('dialog').waitFor({ state: 'hidden' })
  await p.goto(origin + '/square/' + root.id, { waitUntil: 'networkidle' })
  await p.screenshot({
    path: artifactDir + '/strata-populated-thread-mobile.png',
    fullPage: true,
  })
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  )
  await p.getByRole('button', { name: 'Kembali', exact: true }).click()
  await p.getByRole('button', { name: 'Buka pencarian', exact: true }).click()
  await p
    .getByRole('dialog', { name: 'Cari ETNOS', exact: true })
    .getByLabel('Cari ETNOS', { exact: true })
    .fill('Synthetic')
  await p
    .getByRole('button', { name: 'Lihat semua hasil', exact: false })
    .click()
  await p.getByRole('heading', { name: 'Cari', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      realPublicWrites: 0,
      groupCreated: true,
      spaceCreated: true,
      sponsorAdmitted: true,
      workCreated: true,
      resultReviewed: true,
      contextFeed: true,
      activityRead: true,
      appearancePersisted: true,
      customValidation: true,
      mobileSheet: true,
      browserErrors: errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
