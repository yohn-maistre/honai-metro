// Disposable loopback fixture: never writes to a deployed ETNOS node.
import assert from 'node:assert/strict'
import {
  Strata,
  Wiki,
  Groups,
  api,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision(
    'did:web:refinement.example',
    'Marta · synthetic reviewer',
  ),
  peer = s.provision(
    'did:web:contributor.example',
    'Yonas · synthetic contributor',
  )
const room = s.createCommunity(
    owner.actor.id,
    'Cerita Jayapura',
    'Synthetic public place for conversation.',
    'public',
    true,
    'approval',
  ),
  hidden = s.createCommunity(
    owner.actor.id,
    'Ruang bahasa',
    'Synthetic protected room.',
    'hidden-private',
  )
s.setMember(owner.actor.id, room.id, peer.actor.id, true)
const g = new Groups(s, { stewardDid: owner.actor.did }),
  place = g.createContext(owner.actor.id, {
    slug: 'jayapura',
    title: 'Jayapura',
    kind: 'place',
    description: 'Synthetic place',
    language: 'id',
    aliases: [],
  })
const post = s.createPost(
    owner.actor.id,
    room.id,
    'Bagaimana kita merawat sungai dan cerita di sekitar kita?',
  ),
  reply = s.createPost(
    peer.actor.id,
    room.id,
    'Mulai dengan sumber yang dapat dibaca dan ditinjau bersama.',
    post.id,
  )
g.attach(owner.actor.id, 'post', post.id, place.id)
s.run(
  'INSERT INTO actor_profiles VALUES(?,?,?,?)',
  owner.actor.id,
  'Cerita, bahasa dan catatan bersama.',
  'https://example.org',
  'Jayapura, Papua',
)
const w = new Wiki(s),
  page = w.createDraft(
    owner.actor.id,
    room.id,
    'Sungai dan kehidupan bersama',
    {
      text: '## Sungai\n\nCatatan awal dari sumber publik.',
      citations: ['https://example.org/source'],
      language: 'id',
      perspective: 'Attribution is not account identity',
    },
  )
let proposal = w.proposals(owner.actor.id, page.id)[0]
w.decide(owner.actor.id, proposal.id, proposal.digest, true)
w.propose(
  peer.actor.id,
  page.id,
  w.read(page.id).revision_id,
  '## Sungai\n\nTambahan dari sumber publik.',
  ['https://example.org/next'],
  'id',
  'Community account',
)
const handler = api(s),
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
let guest = false,
  fail = false
const errors = [],
  fonts = []
try {
  const ctx = await browser.newContext({
      viewport: { width: 390, height: 900 },
      hasTouch: true,
      isMobile: true,
    }),
    p = await ctx.newPage()
  p.setDefaultTimeout(30000)
  p.on('pageerror', (e) => errors.push(e.message))
  p.on('request', (r) => {
    if (/woff/.test(r.url())) fonts.push(r.url())
  })
  await p.route('**/auth/me', (r) =>
    r.fulfill({
      json: {
        actor: guest ? null : owner.actor,
        csrf: guest ? null : 'fixture',
        steward: !guest,
      },
    }),
  )
  await p.route('**/v1/**', async (r) => {
    const q = r.request(),
      u = new URL(q.url())
    if (fail && u.pathname === '/v1/communities')
      return r.fulfill({
        status: 503,
        json: { error: 'RAW_BACKEND_DETAIL_NOT_FOR_READERS' },
      })
    if (u.pathname === '/v1/news')
      return r.fulfill({
        json: {
          available: true,
          source: {
            name: 'West Papua Watch',
            url: 'https://westpapua.watch/news/',
          },
          items: [],
          selection: { total: 0 },
          pagination: { page: 1, pageSize: 12, nextPage: null },
          placeOptions: [],
        },
      })
    const res = await handler(
      new Request(q.url(), {
        method: q.method(),
        headers: {
          ...q.headers(),
          ...(!guest ? { authorization: 'Bearer ' + owner.token } : {}),
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
  const go = async (route) => {
    await p.goto(origin + route, { waitUntil: 'networkidle' })
    await p.evaluate(() => document.fonts.ready)
  }
  const snap = async (name, width) => {
    await p.setViewportSize({ width, height: 900 })
    await p.evaluate(() => scrollTo(0, 0))
    await p.waitForTimeout(100)
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      name + ' overflow',
    )
    await p.screenshot({
      path: artifactDir + '/refine-' + name + '-' + width + '.png',
      fullPage: true,
    })
  }
  await go('/preferences')
  assert.equal(
    await p.evaluate(() => document.documentElement.dataset.fontPair),
    'gabarito',
  )
  for (const [id, name, family] of [
    ['geist', 'Geist + Geist Serif', 'Geist Serif'],
    ['instrument', 'Instrument Sans + Instrument Serif', 'Instrument Serif'],
    ['newsreader', 'Geist + Newsreader', 'Newsreader Variable'],
    ['source', 'Source Sans 3 + Source Serif 4', 'Source Serif 4 Variable'],
    ['gabarito', 'Gabarito + Geist Serif', 'Geist Serif'],
  ]) {
    await p
      .getByRole('combobox', { name: 'Pasangan huruf', exact: true })
      .click()
    await p.getByRole('option', { name, exact: true }).click()
    await p.waitForFunction(
      (id) => document.documentElement.dataset.fontPair === id,
      id,
    )
    await p.waitForTimeout(250)
    assert.ok(
      await p.evaluate(
        async (family) =>
          (await document.fonts.load('400 24px "' + family + '"')).length > 0,
        family,
      ),
      name + ' actual font face',
    )
    await p.reload({ waitUntil: 'networkidle' })
    assert.equal(
      await p.evaluate(() => document.documentElement.dataset.fontPair),
      id,
    )
  }
  assert.ok(
    fonts.every((url) => new URL(url).origin === origin),
    'fonts self-hosted',
  )
  assert.equal(
    await p.evaluate(() => document.documentElement.dataset.textureStrength),
    'soft',
  )
  await p.getByRole('button', { name: 'Penuh', exact: true }).click()
  await p.reload({ waitUntil: 'networkidle' })
  assert.equal(
    await p.evaluate(() => document.documentElement.dataset.textureStrength),
    'full',
  )
  await p.getByRole('button', { name: 'Halus', exact: true }).click()
  for (const width of [390, 768, 1440]) await snap('preferences', width)
  await go('/wiki/' + page.id)
  await p
    .locator('.wiki-provenance')
    .getByText(owner.actor.name, { exact: true })
    .first()
    .waitFor()
  await p.getByRole('button', { name: 'Usulan 1', exact: true }).click()
  assert.ok(
    (await p.locator('.wiki-change.added').allTextContents())
      .join('')
      .includes('Tambahan'),
  )
  for (const width of [390, 1440]) await snap('wiki-review', width)
  await p
    .getByRole('button', { name: 'Usulkan perubahan', exact: true })
    .click()
  let editor = p.getByRole('textbox', { name: 'Isi revisi', exact: true })
  await editor.fill('## Draf yang belum dikirim\n\nSimpan kontribusi ini.')
  await p
    .getByLabel('Sumber publik', { exact: true })
    .fill('https://example.org/draft-source')
  await p.keyboard.press('Escape')
  await p.getByRole('alertdialog', { name: 'Buang draf?' }).waitFor()
  await p.getByRole('button', { name: 'Lanjut menulis', exact: true }).click()
  assert.ok((await editor.innerText()).includes('Simpan kontribusi'))
  await p.reload({ waitUntil: 'networkidle' })
  await p
    .getByRole('button', { name: 'Usulkan perubahan', exact: true })
    .click()
  editor = p.getByRole('textbox', { name: 'Isi revisi', exact: true })
  assert.ok((await editor.innerText()).includes('Simpan kontribusi'))
  assert.equal(
    await p.getByLabel('Sumber publik', { exact: true }).inputValue(),
    'https://example.org/draft-source',
  )
  for (const width of [390, 1440]) await snap('wiki-draft', width)
  await p.setViewportSize({ width: 390, height: 900 })
  const attribution = p.getByLabel('Atribusi', { exact: true })
  await attribution.scrollIntoViewIfNeeded()
  const fieldBox = await attribution.boundingBox(),
    submitBox = await p
      .getByRole('button', { name: 'Ajukan untuk tinjauan', exact: true })
      .boundingBox()
  assert.ok(
    fieldBox.y + fieldBox.height <= submitBox.y,
    'last field clears sticky action',
  )
  await p.screenshot({
    path: artifactDir + '/refine-wiki-draft-bottom-390.png',
  })

  await p.reload({ waitUntil: 'networkidle' })
  proposal = w
    .proposals(owner.actor.id, page.id)
    .find((r) => r.state === 'pending')
  w.decide(owner.actor.id, proposal.id, proposal.digest, true)
  await p.reload({ waitUntil: 'networkidle' })
  await p
    .getByRole('button', { name: 'Usulkan perubahan', exact: true })
    .click()
  assert.ok(
    (await p.getByRole('alert').innerText()).includes('Halaman sudah berubah'),
  )
  assert.equal(
    await p
      .getByRole('button', { name: 'Ajukan untuk tinjauan', exact: true })
      .isDisabled(),
    true,
  )
  await p
    .getByRole('button', {
      name: 'Sudah dibandingkan · gunakan revisi terbaru',
      exact: true,
    })
    .click()
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Buang draf', exact: true }).click()
  await p
    .getByRole('button', { name: 'Usulkan perubahan', exact: true })
    .click()
  assert.ok(
    !(
      await p
        .getByRole('textbox', { name: 'Isi revisi', exact: true })
        .innerText()
    ).includes('Simpan kontribusi'),
  )
  await p.keyboard.press('Escape')
  await go('/communities')
  await p
    .getByRole('button', { name: /Buat komunitas|Komunitas baru/ })
    .first()
    .click()
  assert.equal(
    await p
      .getByRole('dialog')
      .getByRole('button', { name: 'Buat', exact: true })
      .isDisabled(),
    true,
  )
  await p
    .getByRole('combobox', { name: 'Siapa yang dapat membaca?', exact: true })
    .click()
  await p
    .getByRole('option', { name: 'Semua orang · publik', exact: true })
    .click()
  await p
    .getByText('Persetujuan ini tidak membatasi pembaca.', { exact: false })
    .waitFor()
  await snap('community-create', 390)
  await p.keyboard.press('Escape')
  await go('/communities/' + hidden.id)
  await p.getByRole('button', { name: 'Posting', exact: true }).first().click()
  await p
    .getByRole('dialog')
    .getByRole('textbox', { name: 'Posting', exact: true })
    .fill('Private draft stays private until deliberate switch')
  await p.getByRole('combobox', { name: 'Komunitas', exact: true }).click()
  await p.getByRole('option', { name: room.title, exact: true }).click()
  await p
    .getByRole('alertdialog', { name: 'Pindahkan tulisan ke ruang publik?' })
    .waitFor()
  await p.getByRole('button', { name: 'Tetap privat', exact: true }).click()
  assert.ok((await p.locator('.composer-scope').innerText()).includes('Privat'))
  await p.getByRole('combobox', { name: 'Komunitas', exact: true }).click()
  await p.getByRole('option', { name: room.title, exact: true }).click()
  await p
    .getByRole('button', { name: 'Pindahkan ke publik', exact: true })
    .click()
  assert.ok((await p.locator('.composer-scope').innerText()).includes('Publik'))
  await snap('compose', 390)
  await p.reload({ waitUntil: 'networkidle' })
  for (const width of [320, 390, 768, 1440]) {
    await go('/people/' + owner.actor.id)
    await snap('profile', width)
    await go('/')
    await snap('home', width)
    assert.ok(
      (await p.locator('.cx-post-more').first().boundingBox()).width >= 44,
    )
  }
  fail = true
  await go('/communities')
  assert.ok(
    (await p.getByRole('alert').innerText()).includes('Layanan sementara'),
  )
  assert.ok(!(await p.locator('body').innerText()).includes('RAW_BACKEND'))
  await snap('error', 390)
  fail = false
  const agent = s.provision(
    'did:web:synthetic-wiki-agent.example',
    'Synthetic wiki worker',
    owner.actor.id,
  )
  s.setMember(owner.actor.id, room.id, agent.actor.id, true)
  const mandate = w.grant(
    owner.actor.id,
    agent.actor.id,
    room.id,
    'Synthetic editorial contribution',
    Date.now() + 60000,
  )
  const contributed = w.propose(
    agent.actor.id,
    page.id,
    w.read(page.id).revision_id,
    'Agent proposal for human review',
    [],
    'id',
    'Synthetic source attribution',
    mandate.id,
  )
  await go('/wiki/' + page.id)
  await p.getByRole('button', { name: 'Usulan 1', exact: true }).click()
  assert.ok(
    (await p.locator('.wiki-review-card').first().innerText()).includes(
      'Synthetic wiki worker · Agen',
    ),
  )
  w.decide(owner.actor.id, contributed.id, contributed.digest, true)
  await p.reload({ waitUntil: 'networkidle' })
  assert.ok((await p.locator('.wiki-provenance').innerText()).includes('Agen'))
  await p.getByText('Riwayat', { exact: true }).click()
  assert.ok(
    (await p.locator('.wiki-history-popover').last().innerText()).includes(
      'Synthetic wiki worker · Agen',
    ),
  )
  await p.screenshot({ path: artifactDir + '/refine-wiki-agent-390.png' })
  guest = true
  await go('/')
  await p.locator('.cx-post').first().waitFor()
  assert.equal(await p.locator('.home-context').count(), 0)
  for (const width of [390, 1440]) await snap('guest', width)
  await go('/login')
  await p
    .getByRole('link', { name: 'Tetap membaca tanpa masuk', exact: true })
    .waitFor()
  await snap('login', 390)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      productionWrites: 0,
      fontPairs: 5,
      selfHostedFonts: true,
      draftRecovery: true,
      conflictPreserved: true,
      discardProtection: true,
      editorTeardownClean: true,
      audienceConfirmation: true,
      explicitCommunityAudience: true,
      widths: [320, 390, 768, 1440],
      errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
