import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {resolve} from 'node:path'
import {chromium,origin,api,artifactDir} from './environment.mjs'
const {simulateSteward}=await import(pathToFileURL(resolve(process.env.STRATA_REPO,'scripts/simulate-steward.ts')).href)
const demo=await simulateSteward(':memory:',origin),handler=api(demo.s),browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/auth/me',r=>r.fulfill({json:{actor:demo.owner.actor,csrf:'fixture',steward:false}}))
 await page.route('**/v1/**',async r=>{const q=r.request(),url=new URL(q.url());if(url.pathname==='/v1/news')return r.fulfill({json:{available:true,source:{name:'Simulation',url:'https://example.org'},items:[]}});const res=await handler(new Request(q.url(),{method:q.method(),headers:{...q.headers(),authorization:'Bearer '+demo.owner.token,origin},...(q.method()==='POST'?{body:q.postData()}: {})}));await r.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.from(await res.arrayBuffer())})})
 await page.goto(origin+'/wiki',{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Dalam pengembangan',exact:true}).waitFor();await page.getByRole('link').filter({hasText:'Crocodylus halli: buaya Nugini'}).click();await page.locator('.wiki-provisional-reader').waitFor();assert.match(await page.locator('.wiki-provisional-reader').innerText(),/51 tengkorak/);assert.equal(await page.locator('.wiki-sources a').count(),2)
 await page.locator('.wiki-note-contents').click();await page.getByRole('link',{name:'Lima puluh satu tengkorak, tujuh koleksi',exact:true}).click();assert.ok(new URL(page.url()).hash)
 await page.screenshot({path:artifactDir+'/steward-crocodile-wiki-desktop.png',fullPage:true})
 await page.goto(origin+'/square/'+demo.announcement.id,{waitUntil:'networkidle'});await page.getByText('Halo, sa baru saja tambah catatan ini di Wiki.',{exact:false}).first().waitFor();await page.screenshot({path:artifactDir+'/steward-crocodile-announcement.png',fullPage:true})
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/wiki/notes/'+demo.note.id,{waitUntil:'networkidle'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:artifactDir+'/steward-crocodile-wiki-mobile.png',fullPage:true})
 assert.deepEqual(errors,[]);console.log(JSON.stringify({isolatedSimulation:true,realPublicReferences:2,hostedModel:false,livePost:false,provisionalWiki:true,nativeAnnouncement:true,sectionLinks:true,widths:[390,1440],duplicateState:demo.duplicate.state,pageErrors:0}))
}finally{await browser.close();demo.s.close()}
