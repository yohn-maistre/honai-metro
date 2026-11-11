// Real local engine; delayed requests exercise overlapping network activity.
import assert from 'node:assert/strict'
import {chromium,origin,Strata,api,artifactDir} from './environment.mjs'
import {contrast} from '../../src/appearance-color.ts'
const s=new Strata(':memory:',origin),owner=s.provision('did:web:refinement-fixture.example','Synthetic neighbor')
const room=s.createCommunity(owner.actor.id,'Synthetic public commons','A short community description.','public')
const hidden=s.createCommunity(owner.actor.id,'Protected language fixture','Not for public discovery.','hidden-private')
s.createPost(owner.actor.id,room.id,'A thoughtful text-only conversation deserves the same care as an image. What should we document together?')
s.createPost(owner.actor.id,hidden.id,'Protected text must never become an Explore highlight.')
const handler=api(s),browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
const errors=[]
try {
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
 await ctx.addInitScript(()=>localStorage.setItem('strata.ui.appearance',JSON.stringify({themeMode:'light',base:'paper',accent:'#1680fa',fontPair:'jakarta'})))
 const p=await ctx.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message))
 await p.route('**/auth/me',r=>r.fulfill({json:{actor:owner.actor,csrf:'fixture',steward:false}}))
 await p.route('**/auth/options',r=>r.fulfill({json:{enrollment:'open'}}))
 await p.route('**/v1/**',async r=>{
  const q=r.request(),u=new URL(q.url())
  if(u.pathname==='/v1/search')await new Promise(resolve=>setTimeout(resolve,2200))
  if(u.pathname==='/v1/news'){
   await new Promise(resolve=>setTimeout(resolve,3500))
   return r.fulfill({json:{available:true,source:{name:'Synthetic source',url:'https://example.org'},items:[{id:'synthetic-news',title:'Synthetic headline to verify readable image-overlay hover',summary:'Synthetic news fixture.',publishedAt:'2026-11-12T00:00:00Z',sourceCount:1,url:'https://example.org/story',image:'/branding/tigi-print.webp',sources:[]}]}})
  }
  const res=await handler(new Request(q.url(),{method:q.method(),headers:{...q.headers(),origin,authorization:'Bearer '+owner.token},...(q.method()==='POST'?{body:q.postData()}: {})}))
  await r.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.from(await res.arrayBuffer())})
 })
 await p.goto(origin+'/explore',{waitUntil:'domcontentloaded'})
 await p.locator('.app-load-line').waitFor()
 const samples=await p.evaluate(async()=>{
  const out=[];for(let i=0;i<12;i++){const e=document.querySelector('.app-load-line');out.push(e?{progress:parseFloat(e.style.getPropertyValue('--activity-progress')),complete:e.classList.contains('complete'),value:e.getAttribute('aria-valuenow')}:null);await new Promise(r=>setTimeout(r,200))}return out
 })
 const pending=samples.filter(x=>x&&!x.complete)
 assert.ok(pending.length>=8);assert.ok(pending.every(x=>x.progress<100&&x.value===null))
 assert.ok(pending.every((x,i)=>!i||x.progress>=pending[i-1].progress),'activity never moves backwards while requests overlap')
 assert.ok(pending.at(-1).progress-pending[0].progress<45,'slow progress, not repeated laser sweeps')
 await p.locator('.app-load-line').waitFor({state:'detached'})
 await p.getByRole('button',{name:'Terbaru',exact:true}).click();await p.getByRole('heading',{name:'Percakapan terbaru',exact:true}).waitFor()
 assert.match(await p.locator('.explore-conversations').innerText(),/thoughtful text-only/)
 assert.doesNotMatch(await p.locator('.explore-conversations').innerText(),/Protected text/)
 assert.equal(await p.locator('.explore-conversations .knowledge-tile').count(),0)
 const hero=p.locator('.news-lead.news-photo');await hero.waitFor().catch(async e=>{console.error(JSON.stringify({errors,news:await p.locator('.news-section').first().innerText(),photos:await p.locator('.news-section img').evaluateAll(es=>es.map(x=>({src:x.src,complete:x.complete,naturalWidth:x.naturalWidth})))}));await p.screenshot({path:artifactDir+'/refined-debug.png'});throw e});const ink=await hero.locator('strong').evaluate(e=>getComputedStyle(e).color);await hero.hover();assert.equal(await hero.locator('strong').evaluate(e=>getComputedStyle(e).color),ink)
 await p.screenshot({path:artifactDir+'/refined-explore-desktop.png',fullPage:true})
 await p.goto(origin+'/communities/'+room.id,{waitUntil:'networkidle'});await p.locator('.community-cover img').evaluate(e=>e.decode());assert.match(await p.locator('.community-cover').evaluate(e=>getComputedStyle(e).maskImage),/linear-gradient/)
 await p.screenshot({path:artifactDir+'/refined-community-desktop.png',fullPage:true})
 await p.goto(origin+'/people/'+owner.actor.id,{waitUntil:'networkidle'});await p.locator('.profile-linework').waitFor();assert.equal(await p.locator('.profile-cover img').count(),0);assert.equal(await p.locator('.profile-tabs').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)')
 const compose=p.locator('.sidebar-compose');assert.equal(await compose.evaluate(e=>getComputedStyle(e).boxShadow),'none')
 const colours=await compose.evaluate(e=>{const c=getComputedStyle(e);return [c.backgroundColor,c.color]});assert.notEqual(colours[0],colours[1])
 await p.screenshot({path:artifactDir+'/refined-profile-desktop.png',fullPage:true})
 await p.setViewportSize({width:390,height:844});await p.goto(origin+'/explore',{waitUntil:'networkidle'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:artifactDir+'/refined-explore-mobile.png',fullPage:true})
 await p.goto(origin+'/login',{waitUntil:'networkidle'});assert.equal(await p.locator('.welcome-wordmark svg .letter').count(),6)
 for(const theme of ['light','dark']){
  await p.evaluate(theme=>{const a=JSON.parse(localStorage.getItem('strata.ui.appearance'));a.themeMode=theme;localStorage.setItem('strata.ui.appearance',JSON.stringify(a))},theme)
  await p.reload({waitUntil:'networkidle'});const c=await p.locator('.welcome-art figcaption').evaluate(e=>{const x=getComputedStyle(e);const root=getComputedStyle(document.documentElement);return {ink:root.getPropertyValue('--foreground').trim(),surface:root.getPropertyValue('--reading-surface').trim(),bg:x.backgroundColor}})
  assert.ok(contrast(c.ink,c.surface)>7,theme+' caption contrast');assert.ok(c.bg)
 }
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({synthetic:true,monotonicOverlappingActivity:true,noFalsePercentage:true,publicTextHighlights:true,privateHighlightExcluded:true,imageHoverReadable:true,maskedCommunityCover:true,abstractProfile:true,seamlessTabs:true,shadowFreePrimary:true,mobileOverflow:false,vectorWordmark:true,captionBothThemes:true,pageErrors:0}))
 await ctx.close()
}finally{await browser.close();s.close()}
