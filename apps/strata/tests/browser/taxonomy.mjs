// Loopback only: synthetic discovery types and wiki review; no production identities.
import assert from 'node:assert/strict'
import {
  Strata,
  Groups,
  api,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
const s = new Strata(':memory:', origin),
  owner = s.provision('did:web:taxonomy-owner.example', 'Synthetic moderator'),
  peer = s.provision('did:web:taxonomy-member.example', 'Synthetic member')
const room = s.createCommunity(
    owner.actor.id,
    'Obrolan musik',
    'A membership room.',
    'public',
  ),
  hidden = s.createCommunity(
    owner.actor.id,
    'Protected room',
    'Private fixture.',
    'hidden-private',
  )
s.setMember(owner.actor.id, room.id, peer.actor.id, true)
const groups = new Groups(s, { stewardDid: owner.actor.did }),
  topic = groups.createContext(owner.actor.id, {
    slug: 'musik-reggae',
    title: 'Musik Reggae',
    kind: 'topic',
    description: 'Bincang dan catatan musik.',
    language: 'id',
    aliases: [],
  }),
  place = groups.createContext(owner.actor.id, {
    slug: 'jayapura',
    title: 'Jayapura',
    kind: 'place',
    description: 'Synthetic place.',
    language: 'id',
    aliases: [],
  })
const post = s.createPost(
    owner.actor.id,
    room.id,
    'Sebuah percakapan yang layak dirawat.',
  ),
  privatePost = s.createPost(
    owner.actor.id,
    hidden.id,
    'Protected source, never offered to public wiki.',
  )
for (const text of ['Quelle question one?', 'Quelle question two?'])
  s.createPost(owner.actor.id, room.id, text, undefined, undefined, {
    content: { poll: { options: ['A', 'B'], closesAt: Date.now() + 86400000 } },
  })
let viewer = owner,
  inference = 0
const handler = api(s, { stewardDid: owner.actor.did }),
  browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
try {
  const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    }),
    errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.route('**/auth/me', (r) =>
    r.fulfill({
      json: viewer
        ? { actor: viewer.actor, csrf: 'fixture', steward: viewer === owner }
        : { actor: null, csrf: null, steward: false },
    }),
  )
  await p.route('**/v1/**', async (r) => {
    const q = r.request(),
      u = new URL(q.url())
    if (u.pathname.endsWith('/suggestions')) inference++
    if (u.pathname === '/v1/news')
      return r.fulfill({
        json: {
          available: true,
          items: [],
          pagination: { page: 1, nextPage: null },
          placeOptions: [],
        },
      })
    const res = await handler(
      new Request(q.url(), {
        method: q.method(),
        headers: {
          ...q.headers(),
          origin,
          ...(viewer ? { authorization: 'Bearer ' + viewer.token } : {}),
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
  const go = async (path) => p.goto(origin + path, { waitUntil: 'networkidle' })
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 })
    await go('/contexts')
    await p
      .locator('.community-directory')
      .getByText('Jayapura', { exact: true })
      .waitFor()
    assert.equal(
      await p
        .locator('.community-directory')
        .getByText('Musik Reggae', { exact: true })
        .count(),
      0,
    )
    await p.getByRole('button', { name: 'Topik', exact: true }).click()
    await p.waitForURL('**/topics')
    await p
      .locator('.community-directory')
      .getByText('Musik Reggae', { exact: true })
      .waitFor()
    assert.equal(
      await p
        .locator('.community-directory')
        .getByText('Jayapura', { exact: true })
        .count(),
      0,
    )
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    if (width === 390)
      await p.screenshot({
        path: artifactDir + '/taxonomy-topics-390.png',
        animations: 'disabled',
      })
  }
  await p.setViewportSize({ width: 390, height: 844 })
  await go('/contexts/musik-reggae')
  await p.getByRole('heading', { name: 'Musik Reggae', exact: true }).waitFor()
  await p.waitForFunction(
    () =>
      document.querySelector('.surface-heading').textContent.trim() === 'Topik',
  )
  assert.equal(await p.locator('.context-relations').count(), 0)
  assert.equal(
    await p.getByRole('heading', { name: 'Percakapan', exact: true }).count(),
    0,
  )
  await p
    .getByText('Belum ada percakapan tentang Musik Reggae.', { exact: true })
    .waitFor()
  await p.screenshot({
    path: artifactDir + '/taxonomy-empty-topic-390.png',
    animations: 'disabled',
  })
  await go('/topics')
  await p.getByRole('button', { name: 'Buat topik', exact: true }).click()
  const create = p.getByRole('dialog', { name: 'Topik publik', exact: true })
  await create.waitFor()
  assert.equal(await create.getByRole('combobox', { name: 'Jenis' }).count(), 0)
  await p.keyboard.press('Escape')
  await p.waitForURL('**/topics')
  await go('/')
  await p.getByRole('button', { name: 'Buka pencarian', exact: true }).click()
  const search = p.getByRole('dialog')
  await search.getByRole('button', { name: 'Topik', exact: true }).click()
  await search.getByText('Musik Reggae', { exact: true }).waitFor()
  assert.equal(await search.getByText('Jayapura', { exact: true }).count(), 0)
  await search
    .getByRole('button', { name: 'Tempat & bahasa', exact: true })
    .click()
  await search.getByText('Jayapura', { exact: true }).waitFor()
  assert.equal(
    await search.getByText('Musik Reggae', { exact: true }).count(),
    0,
  )
  await p.keyboard.press('Escape')
  await go('/')
  const card = p.locator('[data-post="' + post.id + '"]')
  await card.getByRole('button', { name: 'Opsi posting', exact: true }).click()
  await p
    .getByRole('menuitem', { name: 'Tinjau sebagai bahan wiki', exact: true })
    .click()
  const review = p.getByRole('dialog', { name: 'Bahan wiki', exact: true })
  await review.waitFor()
  assert.equal(inference, 0)
  await review.getByText(post.text, { exact: true }).waitFor()
  await review
    .getByRole('button', { name: 'Mulai draf wiki', exact: true })
    .click()
  const draft = p.getByRole('dialog', { name: 'Halaman Wiki', exact: true })
  await draft.waitFor()
  assert.ok(
    (
      await draft
        .getByRole('textbox', { name: 'Isi revisi', exact: true })
        .textContent()
    ).includes(post.text),
  )
  assert.equal(s.get('SELECT count(*) n FROM wiki_pages').n, 0)
  await p.screenshot({
    path: artifactDir + '/taxonomy-wiki-draft-390.png',
    animations: 'disabled',
  })
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Buang draf', exact: true }).click()
  await go('/square/' + post.id)
  assert.equal(
    await p.getByText('Jadikan pengetahuan bersama', { exact: true }).count(),
    0,
  )
  await p
    .locator('[data-post="' + post.id + '"]')
    .getByRole('button', { name: 'Opsi posting', exact: true })
    .click()
  await p
    .getByRole('menuitem', { name: 'Tinjau sebagai bahan wiki', exact: true })
    .click()
  await p.getByRole('dialog', { name: 'Bahan wiki' }).waitFor()
  await p.screenshot({
    path: artifactDir + '/taxonomy-wiki-review-390.png',
    animations: 'disabled',
  })
  await p.keyboard.press('Escape')
  await go('/square/' + privatePost.id)
  await p
    .locator('[data-post="' + privatePost.id + '"]')
    .getByRole('button', { name: 'Opsi posting', exact: true })
    .click()
  assert.equal(
    await p
      .getByRole('menuitem', { name: 'Tinjau sebagai bahan wiki', exact: true })
      .count(),
    0,
  )
  viewer = peer
  await go('/square/' + post.id)
  await p
    .locator('[data-post="' + post.id + '"]')
    .getByRole('button', { name: 'Opsi posting', exact: true })
    .click()
  assert.equal(
    await p
      .getByRole('menuitem', { name: 'Tinjau sebagai bahan wiki', exact: true })
      .count(),
    0,
  )
  await p.keyboard.press('Escape')
  await go('/square/' + post.id + '?review=wiki')
  assert.equal(await p.getByRole('dialog', { name: 'Bahan wiki' }).count(), 0)
  await go('/explore')
  await p.locator('.engagement-question').first().waitFor()
  assert.equal(
    await p
      .locator('.engagement-compact > .engagement-question')
      .last()
      .evaluate((e) => getComputedStyle(e).borderBottomWidth),
    '0px',
  )
  assert.equal(
    await p
      .locator('.engagement-compact')
      .evaluate((e) => getComputedStyle(e).borderBottomWidth),
    '1px',
  )
  viewer = null
  await go('/topics')
  assert.equal(await p.getByRole('button', { name: 'Buat topik' }).count(), 0)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      fixtureOnly: true,
      productionWrites: 0,
      topicsSeparate: true,
      legacyLinks: true,
      searchKinds: true,
      wikiMenu: true,
      privateAndMemberDenied: true,
      noAutomaticInference: true,
      widths: [320, 390, 768, 1440],
      browserErrors: errors,
    }),
  )
} finally {
  await browser.close()
  s.close()
}
