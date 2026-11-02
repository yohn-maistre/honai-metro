import assert from 'node:assert/strict'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:rich-browser.example', 'Synthetic steward'),
  c = s.createCommunity(
    owner.actor.id,
    'Mee · synthetic',
    'No real community data',
    'public',
  )
const story = s.createPost(
  owner.actor.id,
  c.id,
  '## Percakapan\n\nA paragraph with **formatting** and [a safe link](https://example.org).\n\n<script>window.injected=true</script><img src=x onerror="window.injected=true">\n\n' +
    'Readable long text. '.repeat(100),
  undefined,
  undefined,
  {
    content: {
      title: 'Catatan percakapan',
      format: 'markdown',
      warning: 'Synthetic warning',
      url: 'https://youtu.be/dQw4w9WgXcQ',
    },
  },
)
const poll = s.createPost(
  owner.actor.id,
  c.id,
  'Pilih waktu pertemuan',
  undefined,
  undefined,
  {
    content: {
      poll: { options: ['Pagi', 'Sore'], closesAt: Date.now() + 86400000 },
    },
  },
)
s.createPost(
  owner.actor.id,
  c.id,
  'Pertemuan komunitas',
  undefined,
  undefined,
  {
    content: {
      event: { startsAt: Date.now() + 86400000, location: 'Aula komunitas' },
    },
  },
)
const handler = api(s),
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    errors = [],
    remote = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    if (/youtube|vimeo/.test(new URL(r.url()).hostname)) remote.push(r.url())
  })
  await page.route(
    /https:\/\/(www\.youtube-nocookie\.com|player\.vimeo\.com)\//,
    (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<html>Fixture video player</html>',
      }),
  )
  await page.route('**/auth/me', (r) =>
    r.fulfill({
      json: { actor: owner.actor, csrf: 'fixture-only', steward: true },
    }),
  )
  await page.route('**/v1/**', async (r) => {
    const q = r.request()
    if (new URL(q.url()).pathname.startsWith('/v1/video-preview/'))
      return r.fulfill({
        json: {
          title: 'Synthetic video title',
          provider: 'YouTube',
          image: null,
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
    await r.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Pagi 0', exact: true }).click()
  assert.equal(s.getPost(owner.actor.id, poll.id).poll.myVote, 0)
  await page.getByRole('button', { name: 'Ikut', exact: true }).click()
  await page.getByRole('button', { name: 'Tampilkan', exact: true }).click()
  await page
    .getByRole('button', { name: 'Baca selengkapnya', exact: true })
    .click()
  assert.equal(await page.evaluate(() => window.injected), undefined)
  assert.equal(
    await page.locator('.post-markdown script,.post-markdown img').count(),
    0,
  )
  await page.locator('.video-preview').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Putar video', exact: true }).waitFor()
  assert.equal(remote.length, 0)
  assert.equal(await page.locator('iframe').count(), 0)
  await page.getByRole('button', { name: 'Putar video', exact: true }).click()
  await page.locator('iframe').waitFor()
  assert.equal(
    await page.locator('iframe').getAttribute('referrerpolicy'),
    'strict-origin-when-cross-origin',
  )
  await page.screenshot({
    path: artifactDir + '/strata-rich-feed-390.png',
    fullPage: true,
  })
  await page.goto(origin + '/square/' + story.id, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Tampilkan', exact: true }).click()
  const box = await page.locator('.rich-post').first().boundingBox()
  assert.ok(box.width > 300)
  await page
    .getByRole('button', { name: 'Opsi posting', exact: true })
    .first()
    .click()
  await page
    .getByRole('menuitem', { name: 'Edit posting', exact: true })
    .click()
  await page
    .getByLabel('Judul (opsional)', { exact: true })
    .fill('Catatan diperbarui')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Simpan', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'Catatan diperbarui', exact: true })
    .waitFor()
  await page
    .getByRole('button', { name: 'Opsi posting', exact: true })
    .first()
    .click()
  await page
    .getByRole('menuitem', { name: 'Kunci percakapan', exact: true })
    .click()
  await page.getByLabel('Alasan untuk catatan moderator').fill('Synthetic test')
  await page.getByRole('button', { name: 'Terapkan', exact: true }).click()
  await page
    .getByText('Percakapan dikunci oleh moderator.', { exact: true })
    .waitFor()
  assert.equal(
    await page.getByLabel('Tulis balasan', { exact: true }).count(),
    0,
  )
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    )
  }
  await page.screenshot({
    path: artifactDir + '/strata-rich-thread-1440.png',
    fullPage: true,
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Posting', exact: true })
    .first()
    .click()
  const composer = page.getByRole('dialog', { name: 'Posting baru' })
  await composer
    .getByLabel('Posting', { exact: true })
    .fill('**A real composer contribution**')
  await composer
    .getByRole('button', { name: 'Opsi konten', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Judul', exact: true }).click()
  await composer
    .getByLabel('Judul posting', { exact: true })
    .fill('Posting dari composer')
  await composer
    .getByRole('button', { name: 'Opsi konten', exact: true })
    .click()
  await page
    .getByRole('menuitemcheckbox', { name: 'Editor tulisan', exact: true })
    .click()
  await page
    .getByRole('menuitem', { name: 'Jajak pendapat', exact: true })
    .click()
  await composer.getByLabel('Pilihan 1', { exact: true }).fill('Pertama')
  await composer.getByLabel('Pilihan 2', { exact: true }).fill('Kedua')
  await composer.getByRole('button', { name: 'Posting', exact: true }).click()
  await page
    .getByRole('heading', { name: 'Posting dari composer', exact: true })
    .waitFor()
  const created = s
    .feed(owner.actor.id)
    .find((p) => p.content.title === 'Posting dari composer')
  assert.equal(created.content.format, 'markdown')
  assert.equal(created.poll.options.length, 2)
  await page.evaluate(() => {
    document.activeElement?.blur()
    scrollTo(0, 0)
  })
  await page.screenshot({
    path: artifactDir + '/strata-rich-compose-result-1440.png',
    fullPage: true,
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Pilih linimasa', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Komunitasku', exact: true }).click()
  assert.match(
    await page
      .getByRole('button', { name: 'Pilih linimasa', exact: true })
      .innerText(),
    /Komunitasku/,
  )
  await page
    .getByRole('button', { name: 'Posting', exact: true })
    .first()
    .click()
  await page
    .getByRole('dialog', { name: 'Posting baru' })
    .getByLabel('Posting', { exact: true })
    .fill('Keep this draft while reviewing')
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  await page.getByRole('alertdialog', { name: 'Buang draf?' }).waitFor()
  await page
    .getByRole('button', { name: 'Lanjut menulis', exact: true })
    .click()
  assert.equal(
    await page
      .getByRole('dialog', { name: 'Posting baru' })
      .getByLabel('Posting', { exact: true })
      .inputValue(),
    'Keep this draft while reviewing',
  )
  await page.keyboard.press('Escape')
  await page.getByRole('alertdialog', { name: 'Buang draf?' }).waitFor()
  await page
    .getByRole('button', { name: 'Lanjut menulis', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: 'Posting baru' })
    .getByRole('button', { name: 'Tutup', exact: true })
    .click()
  await page.getByRole('alertdialog', { name: 'Buang draf?' }).waitFor()
  await page.getByRole('button', { name: 'Buang draf', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Posting baru' })
    .waitFor({ state: 'hidden' })
  await page.keyboard.press('Control+b')
  await page
    .getByRole('button', { name: 'Semua ruang', exact: true })
    .first()
    .click()
  await page
    .getByRole('link', { name: 'Beranda', exact: true })
    .first()
    .waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await page
    .getByRole('button', { name: 'Pilih linimasa', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Terbaru', exact: true }).click()
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  )
  assert.equal(await page.getByRole('main').count(), 1)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      draftDiscardAndResume: true,
      escapeAndClosePreserveDraft: true,
      mobileTimelineSwitch: true,
      sidebarRestore: true,
      markdownSanitized: true,
      noAutomaticVideoRequests: true,
      pollVoted: true,
      eventRsvp: true,
      editSaved: true,
      lockedComposerHidden: true,
      mobileOverflow: false,
      browserErrors: errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
