import assert from 'node:assert/strict'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:next-fixture.example', 'Synthetic steward'),
  community = s.createCommunity(
    owner.actor.id,
    'Mee commons',
    'Cerita, bahasa dan pengetahuan bersama.',
    'public',
  ),
  handler = api(s, { stewardDid: owner.actor.did })
const root = s.createPost(
    owner.actor.id,
    community.id,
    'A source conversation',
  ),
  one = s.createPost(owner.actor.id, community.id, 'First reply', root.id),
  two = s.createPost(owner.actor.id, community.id, 'Second reply', one.id)
s.createPost(owner.actor.id, community.id, 'Deep focused reply', two.id)
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
    }),
    errors = [],
    newsQueries = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/auth/me', (r) =>
    r.fulfill({ json: { actor: owner.actor, csrf: 'fixture', steward: true } }),
  )
  await page.route('**/v1/**', async (r) => {
    const q = r.request(),
      u = new URL(q.url())
    if (u.pathname === '/v1/news') {
      newsQueries.push(u.search)
      const pageNo = Number(u.searchParams.get('page') ?? 1)
      return r.fulfill({
        json: {
          available: true,
          source: {
            name: 'West Papua Watch',
            url: 'https://westpapua.watch/news/',
          },
          items: Array.from({ length: 6 }, (_, i) => ({
            id: String(pageNo * 10 + i),
            title: 'Synthetic public story ' + (pageNo * 10 + i),
            summary: 'A sourced story with a related conversation.',
            url: 'https://westpapua.watch/story/?id=' + (pageNo * 10 + i),
            sourceCount: 2,
            publishedAt: '2026-11-03T00:00:00Z',
            image: null,
          })),
          selection: { total: 18 },
          placeOptions: [{ slug: 'mee', name: 'Mee' }],
          pagination: {
            page: pageNo,
            pageSize: 6,
            hasMore: pageNo < 3,
            nextPage: pageNo < 3 ? pageNo + 1 : null,
          },
        },
      })
    }
    const res = await handler(
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
  await page.goto(origin + '/wiki', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Tulis halaman', exact: true }).click()
  let dialog = page.getByRole('dialog')
  await dialog
    .getByLabel('Nama', { exact: true })
    .fill('Tambeyau · Kisah Danau Tigi')
  await dialog
    .getByRole('textbox', { name: 'Isi revisi', exact: true })
    .fill('Kisah dan pengetahuan yang ditinjau bersama.')
  await dialog
    .getByRole('button', { name: 'Ajukan untuk tinjauan', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'Tambeyau · Kisah Danau Tigi', exact: true })
    .waitFor()
  const wiki = s.get(
    'SELECT * FROM wiki_pages WHERE title=?',
    'Tambeyau · Kisah Danau Tigi',
  )
  assert.equal(wiki.draft, 1)
  assert.equal(
    (await api(s)(new Request(origin + '/v1/wiki/' + wiki.id))).status,
    404,
  )
  await page.getByRole('button', { name: 'Usulan 1', exact: true }).click()
  await page.getByRole('button', { name: 'Terima revisi', exact: true }).click()
  await page.waitForFunction(() =>
    document
      .querySelector('.wiki-body')
      ?.textContent.includes('Kisah dan pengetahuan'),
  )
  assert.equal(
    s.get('SELECT draft FROM wiki_pages WHERE id=?', wiki.id).draft,
    0,
  )
  await page.screenshot({
    path: artifactDir + '/commons-wiki-1440.png',
    fullPage: true,
  })
  await page.goto(origin + '/people/' + owner.actor.id, {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Edit profil', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Bio', { exact: true })
    .fill('Mee yoka · Catatan dan cerita bersama.')
  await page
    .getByRole('dialog')
    .getByLabel('Situs web', { exact: true })
    .fill('https://example.org/')
  await page
    .getByRole('dialog')
    .getByLabel('Lokasi (opsional)', { exact: true })
    .fill('Papua')
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click()
  await page
    .getByText('Mee yoka · Catatan dan cerita bersama.', { exact: true })
    .waitFor()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Posting', exact: true })
    .first()
    .click()
  dialog = page.getByRole('dialog', { name: 'Posting baru' })
  await dialog.getByRole('button', { name: 'Opsi konten', exact: true }).click()
  await page
    .getByRole('menuitemcheckbox', { name: 'Editor tulisan', exact: true })
    .click()
  await dialog
    .getByRole('textbox', { name: 'Posting', exact: true })
    .fill('Catatan panjang dengan gambar di dalam tulisan.')
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 32
    c.getContext('2d').fillRect(0, 0, 64, 32)
    return c.toDataURL('image/png').split(',')[1]
  })
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  })
  await dialog.getByRole('button', { name: 'Sisipkan', exact: true }).click()
  await dialog.locator('.document-prose img').waitFor()
  await dialog.getByRole('button', { name: 'Posting', exact: true }).click()
  await page.locator('.inline-image').waitFor()
  const posted = s
    .feed(owner.actor.id)
    .find((p) => p.text.includes('Catatan panjang'))
  assert.equal(posted.content.inlineMedia.version, 1)
  assert.equal(posted.content.inlineMedia.ids.length, 1)
  await page.locator('.inline-image').click()
  await page
    .getByRole('button', { name: 'Tutup gambar', exact: true })
    .waitFor()
  await page.getByRole('button', { name: 'Tutup gambar', exact: true }).click()
  await page.goto(origin + '/square/' + root.id, { waitUntil: 'networkidle' })
  assert.equal(
    await page.getByText('Deep focused reply', { exact: true }).count(),
    0,
  )
  await page.locator('a.thread-open-branch').click()
  await page.getByText('Deep focused reply', { exact: true }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/square/' + two.id)
  await page.goto(origin + '/news', { waitUntil: 'networkidle' })
  await page
    .getByRole('combobox', { name: 'Pilih liputan', exact: true })
    .click()
  await page
    .getByRole('option', { name: 'Tanah & lingkungan', exact: true })
    .click()
  await page.waitForURL('**/news?desk=land')
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await page.waitForURL('**page=2')
  await page
    .getByRole('combobox', { name: 'Pilih tempat', exact: true })
    .click()
  await page.getByRole('option', { name: 'Mee', exact: true }).click()
  await page.waitForURL('**place=mee')
  assert.equal(new URL(page.url()).searchParams.has('page'), false)
  assert.ok(
    newsQueries.some((q) => q.includes('desk=land') && q.includes('page=2')),
  )
  await page.screenshot({
    path: artifactDir + '/commons-news-1440.png',
    fullPage: true,
  })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Tata letak beranda', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Tiga lajur', exact: false }).click()
  await page.waitForFunction(
    () => document.querySelectorAll('.feed-column').length === 3,
  )
  assert.equal(new URL(page.url()).pathname, '/')
  const geometry = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: innerHeight,
    header: document.querySelector('.cx-topbar').getBoundingClientRect().bottom,
    toolbar: document.querySelector('.board-toolbar').getBoundingClientRect()
      .top,
  }))
  assert.ok(geometry.height <= geometry.viewport + 2, JSON.stringify(geometry))
  assert.ok(geometry.toolbar >= geometry.header)
  await page.screenshot({
    path: artifactDir + '/commons-home-columns-1440.png',
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Semua ruang', exact: true }).click()
  await page.getByRole('dialog', { name: 'Navigasi' }).waitFor()
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Pengaturan', exact: true })
    .click()
  await page.waitForURL('**/preferences')
  await page
    .getByRole('dialog', { name: 'Navigasi' })
    .waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Semua ruang', exact: true }).click()
  const panel = page
    .getByRole('dialog', { name: 'Navigasi' })
    .locator('div.touch-pan-y')
  await panel.dispatchEvent('pointerdown', {
    pointerType: 'touch',
    pointerId: 1,
    clientX: 230,
    clientY: 200,
  })
  await panel.dispatchEvent('pointermove', {
    pointerType: 'touch',
    pointerId: 1,
    clientX: 90,
    clientY: 204,
  })
  await panel.dispatchEvent('pointerup', {
    pointerType: 'touch',
    pointerId: 1,
    clientX: 90,
    clientY: 204,
  })
  await page
    .getByRole('dialog', { name: 'Navigasi' })
    .waitFor({ state: 'hidden' })
  for (const [name, route] of [
    ['wiki', '/wiki/' + wiki.id],
    ['news', '/news'],
    ['directory', '/communities'],
    ['thread', '/square/' + root.id],
    ['voices', '/voices'],
    ['profile', '/people/' + owner.actor.id],
  ]) {
    await page.goto(origin + route, { waitUntil: 'networkidle' })
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    )
    await page.screenshot({
      path: artifactDir + '/commons-' + name + '-390.png',
      fullPage: true,
    })
  }
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto(origin + '/explore', { waitUntil: 'networkidle' })
  for (const name of ['Aktivitas', 'Tersimpan', 'Kerja publik']) {
    const box = await page
      .locator('[data-slot=sidebar-content]')
      .getByRole('link', { name, exact: true })
      .boundingBox()
    assert.ok(box && box.x >= 0 && box.x + box.width <= 76, name)
  }
  await page.screenshot({ path: artifactDir + '/commons-explore-768.png' })
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      draftPrivacy: true,
      reviewedWiki: true,
      richEditor: true,
      inlineImageViewer: true,
      focusedBranch: true,
      newsPaging: true,
      homeColumns: true,
      mobileClose: true,
      dragDismissal: true,
      realPublicWrites: 0,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
