import assert from 'node:assert/strict'
import { Strata, api, chromium, origin, artifactDir } from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:dialog-fixture.example', 'Synthetic author'),
  c = s.createCommunity(
    owner.actor.id,
    'Mee conversation',
    'Synthetic dialogue review',
    'public',
  ),
  p = s.createPost(
    owner.actor.id,
    c.id,
    'A synthetic post for editing',
    undefined,
    undefined,
    { content: { title: 'Synthetic field note' } },
  ),
  handler = api(s),
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
  const bounds = async (dialog) => {
    const b = await dialog.boundingBox()
    assert.ok(
      b.x >= -1 &&
        b.y >= -1 &&
        b.x + b.width <= page.viewportSize().width + 1 &&
        b.y + b.height <= page.viewportSize().height + 1,
    )
  }
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .locator('[data-post="' + p.id + '"] .cx-post-content')
    .click({ button: 'right', position: { x: 24, y: 72 } })
  await page
    .getByRole('menuitem', { name: 'Edit posting', exact: true })
    .waitFor()
  await page
    .getByRole('menuitem', { name: 'Edit posting', exact: true })
    .click()
  let edit = page.getByRole('dialog', { name: 'Edit posting', exact: true })
  await edit.waitFor()
  await bounds(edit)
  await page.waitForTimeout(180)
  await page.screenshot({ path: artifactDir + '/dialog-edit-1440.png' })
  await edit
    .getByLabel('Posting', { exact: true })
    .fill('Unsaved synthetic edit')
  await page.keyboard.press('Escape')
  await page
    .getByRole('alertdialog', { name: 'Buang perubahan?', exact: true })
    .waitFor()
  await page
    .getByRole('button', { name: 'Lanjut mengedit', exact: true })
    .click()
  assert.equal(
    await edit.getByLabel('Posting', { exact: true }).inputValue(),
    'Unsaved synthetic edit',
  )
  await edit.getByRole('button', { name: 'Simpan', exact: true }).click()
  await edit.waitFor({ state: 'hidden' })
  assert.equal(s.getPost(owner.actor.id, p.id).text, 'Unsaved synthetic edit')
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page
      .getByRole('button', { name: 'Opsi posting', exact: true })
      .click()
    await page
      .getByRole('menuitem', { name: 'Edit posting', exact: true })
      .click()
    await bounds(edit)
    await page.waitForTimeout(180)
    await page.screenshot({ path: artifactDir + `/dialog-edit-${width}.png` })
    await edit.getByRole('button', { name: 'Batal', exact: true }).click()
    await page
      .getByRole('button', { name: 'Opsi posting', exact: true })
      .click()
    await page
      .getByRole('menuitem', { name: 'Hapus posting', exact: true })
      .click()
    const remove = page.getByRole('dialog', {
      name: 'Hapus posting?',
      exact: true,
    })
    await remove.waitFor()
    await bounds(remove)
    await page.waitForTimeout(180)
    await page.screenshot({ path: artifactDir + `/dialog-delete-${width}.png` })
    await page.keyboard.press('Escape')
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Posting', exact: true })
    .first()
    .click()
  const compose = page.getByRole('dialog', {
    name: 'Posting baru',
    exact: true,
  })
  await compose
    .getByRole('combobox', { name: 'Komunitas', exact: true })
    .click()
  await page
    .getByRole('option', { name: 'Mee conversation', exact: true })
    .waitFor()
  await page.waitForTimeout(180)
  await page.screenshot({ path: artifactDir + '/dialog-custom-select-390.png' })
  await page.keyboard.press('Escape')
  await compose.getByRole('button', { name: 'Batal', exact: true }).click()
  assert.equal(await page.locator('select:visible').count(), 0)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      realPublicWrites: 0,
      customSelect: true,
      rightClickMenu: true,
      editDiscardProtection: true,
      edited: true,
      dialogBounds: [390, 768, 1440],
      errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
