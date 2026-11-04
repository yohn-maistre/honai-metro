import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {
  Strata,
  Groups,
  api,
  chromium,
  origin,
  artifactDir,
} from './environment.mjs'
let decisionCalls=0
const capture=process.env.STRATA_PUBLIC_NEWS_FIXTURES
const newsFixture=capture?JSON.parse(await readFile(join(capture,'news.json'),'utf8')):{available:true,source:{name:'West Papua Watch',url:'https://westpapua.watch/news/'},selection:{total:3,desk:'focus',place:''},pagination:{page:1,pageSize:12,nextPage:null},placeOptions:[{slug:'jayapura',name:'Jayapura'}],items:[42,43,44].map(id=>({id:String(id),title:'Local news fixture '+id+' with a longer headline for mobile layout',url:'https://westpapua.watch/story/?id='+id,publishedAt:'2026-11-03T00:00:00Z',sourceCount:1,image:'/v1/news/'+id+'/image',imageCredit:'Local fixture',summary:'Synthetic public reporting used only to exercise the local news layout.'}))}
const storyFixture=capture?JSON.parse(await readFile(join(capture,'story.json'),'utf8')):{...newsFixture.items[0],keyPoints:[],places:[],sources:[{title:'Local source',url:'https://example.org/source',publisher:'Synthetic source',summary:'Synthetic public source summary.'}]}
const s = new Strata(':memory:', origin),
  owner = s.provision(
    'did:web:mobile-fixture.example',
    'Synthetic mobile member',
  ),
  community = s.createCommunity(
    owner.actor.id,
    'Fixture room',
    'A local fixture.',
    'public',
  ),
  group = new Groups(s).create(
    owner.actor.id,
    'Fixture institute',
    'Public scope',
    'collective',
    'public',
  ),
  handler = api(s,{decisions:{news:async()=>newsFixture.items.map(x=>({id:x.id,title:x.title,publishedAt:x.publishedAt})),run:async input=>{decisionCalls++;return {answers:{story:{choice:'s0',confidence:.95,probabilities:Object.fromEntries(Object.keys(input.questions.story.criteria).map(k=>[k,k==='s0'?.96:.04/(Object.keys(input.questions.story.criteria).length-1)]))},wiki:{noul:.9}}}}}})
s.run(
  'INSERT INTO actor_profiles VALUES(?,?,?,?)',
  owner.actor.id,
  'Catatan, bahasa dan cerita bersama.',
  'https://example.org/',
  'Papua',
)
for (let i = 0; i < 8; i++)
  s.createPost(
    owner.actor.id,
    community.id,
    'Fixture conversation ' +
      i +
      '. ' +
      'A longer conversation with room to read. '.repeat(6),
  )
s.createPost(
  owner.actor.id,
  community.id,
  'A public video',
  undefined,
  undefined,
  { content: { url: 'https://www.youtube.com/watch?v=ZWp5904RkJY' } },
)
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile:true, hasTouch:true }),
    errors = [],
    players = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    if (r.url().includes('youtube-nocookie.com')) players.push(r.url())
  })
  const cover = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 360
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 480, 360)
    ctx.fillStyle = '#60746f'
    ctx.fillRect(0, 45, 480, 270)
    ctx.fillStyle = '#dedbd1'
    ctx.font = '28px sans-serif'
    ctx.fillText('Local video cover', 60, 180)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.route('**/auth/me', (r) =>
    r.fulfill({ json: { actor: owner.actor, csrf: 'fixture', steward: true } }),
  )
  await page.route('https://www.youtube-nocookie.com/**', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<html>Fixture player</html>',
    }),
  )
  await page.route('**/v1/**', async (r) => {
    const q = r.request(),
      u = new URL(q.url())
    if (u.pathname.startsWith('/v1/video-preview/'))
      return r.fulfill(
        u.pathname.endsWith('/image')
          ? { contentType: 'image/png', body: Buffer.from(cover, 'base64') }
          : {
              json: {
                provider: 'YouTube',
                title:
                  'A public video title that stays on one line without making a second bezel',
                image: '/v1/video-preview/youtube/ZWp5904RkJY/image',
              },
            },
      )
    if (u.pathname === '/v1/link-preview')
      return r.fulfill({ json: { available: false } })
    if (u.pathname.match(/^\/v1\/news\/\d+\/image$/)) return r.fulfill(capture?{contentType:'image/jpeg',body:await readFile(join(capture,'images',u.pathname.split('/')[3]+'.jpg'))}:{contentType:'image/png',body:Buffer.from(cover,'base64')})
    if (u.pathname.match(/^\/v1\/news\/\d+$/)) return r.fulfill({json:storyFixture})
    if (u.pathname === '/v1/news')
      return r.fulfill({json:newsFixture})
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
    return r.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  const g=new Groups(s,{stewardDid:owner.actor.did}),context=g.createContext(owner.actor.id,{slug:'jayapura',title:'Jayapura',kind:'place',description:'Synthetic place relations',language:'id',aliases:[]})
  g.attach(owner.actor.id,'group',group.id,context.id)
  const root=s.createPost(owner.actor.id,community.id,'A conversation with room for replies.'),child=s.createPost(owner.actor.id,community.id,'First reply',root.id),nested=s.createPost(owner.actor.id,community.id,'A deeper reply',child.id)
  s.createPost(owner.actor.id,community.id,'Continue at the next level',nested.id)
  s.createPost(owner.actor.id,community.id,'Another direct reply',root.id)
  s.createPost(owner.actor.id,community.id,'Second child branch',child.id)
  g.attach(owner.actor.id,'post',root.id,context.id)
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:844})
    for(const [name,path] of [['news','/news'],['home','/'],['community','/communities/'+community.id],['profile','/people/'+owner.actor.id],['thread','/square/'+root.id],['contexts','/contexts'],['context','/contexts/jayapura'],['group','/groups/'+group.id]]){
      await page.goto(origin+path,{waitUntil:'networkidle'})
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' has no horizontal overflow at '+width)
      await page.screenshot({path:artifactDir+'/friends-'+name+'-'+width+'.png',fullPage:name==='thread'})
      if(width===390){
        assert.equal(await page.locator('.cx-topbar .desktop-menu-toggle:visible').count(),0)
        assert.equal(await page.locator('.home-layout-switch:visible').count(),0)
        if(name==='community'){
          const strip=page.locator('.section-tab-scroll').first();assert.ok(await strip.evaluate(e=>e.scrollWidth>e.clientWidth))
          const box=await strip.boundingBox(),cdp=await page.context().newCDPSession(page)
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width-30,y:box.y+24}]})
          for(let x=box.width-60;x>40;x-=35) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+x,y:box.y+24}]})
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150)
          assert.ok(await strip.evaluate(e=>e.scrollLeft>0),'real touch moves the community tabs')
          await page.getByRole('tab',{name:'Tentang',exact:true}).click();await page.getByRole('tab',{name:'Diskusi',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Wiki',exact:true}).getAttribute('data-state'),'active')
        }
        if(name==='profile'){for(const label of ['Posting','Balasan','Media'])await page.getByRole('button',{name:label,exact:true}).click()}
        if(name==='home'){await page.evaluate(()=>localStorage.setItem('etnos-home-layout','columns'));await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.feed-board').count(),0);await page.evaluate(()=>localStorage.removeItem('etnos-home-layout'))}
      }
      if(name==='context'){await page.getByRole('navigation',{name:'Terhubung dengan Jayapura'}).waitFor();assert.equal(await page.getByRole('link',{name:'Wiki 0',exact:true}).count(),0);await page.locator('.context-relations').getByRole('link',{name:'Percakapan',exact:true}).click();assert.ok(page.url().endsWith('#context-posts'))}
      if(name==='thread'){await page.getByRole('button',{name:'Lihat 1 balasan lain',exact:true}).click();await page.getByText('Second child branch',{exact:true}).waitFor()}
      if(name==='thread'&&width===390){
        assert.equal(decisionCalls,0,'browsing does not trigger inference')
        await page.getByText('Jadikan pengetahuan bersama',{exact:true}).click()
        await page.getByRole('button',{name:'Temukan kaitan & bahan wiki',exact:true}).click()
        await page.getByText('Saran AI',{exact:true}).waitFor()
        await page.getByRole('link',{name:newsFixture.items[0].title,exact:false}).waitFor()
        await page.getByRole('button',{name:'Tinjau sebagai bahan wiki',exact:true}).waitFor()
        assert.equal(decisionCalls,1);assert.equal(s.get('SELECT count(*) n FROM wiki_proposals').n,0,'a suggestion never publishes or proposes')
      }
      if(name==='thread')assert.equal(await page.getByRole('button',{name:'Sembunyikan 1 balasan',exact:true}).count(),0)
    }
  }
  const feed=newsFixture
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/news/'+feed.items[0].id,{waitUntil:'networkidle'});await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  const clearance=await page.evaluate(()=>{const content=document.querySelector('.news-discussion').getBoundingClientRect(),dock=document.querySelector('.cx-mobile-dock').getBoundingClientRect();return dock.top-content.bottom});assert.ok(clearance>=12,'last news content clears the mobile dock: '+clearance)
  await page.screenshot({path:artifactDir+'/friends-news-bottom-390.png'})
  console.log('PASS friends pass: real touch/keyboard tabs, mobile single menu/feed, news layout/filter fixtures, 3 widths, deep thread, dock clearance',clearance)
}finally{await browser.close();s.close()}
