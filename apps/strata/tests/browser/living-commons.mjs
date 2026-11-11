import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {resolve} from 'node:path'
import {Strata,api,Wiki,chromium,origin,artifactDir} from './environment.mjs'
const {sourceFetcher}=await import(pathToFileURL(resolve(process.env.STRATA_REPO,'src/discovery.ts')).href)
const s=new Strata(':memory:',origin),owner=s.provision('did:web:commons-browser.example','Synthetic commons operator'),room=s.createCommunity(owner.actor.id,'Synthetic public commons','Browser fixture','public',true,'open')
const rss='<?xml version="1.0"?><rss version="2.0"><channel><item><title>Source-backed browser discovery</title><link>https://news.example.org/real-link-fixture</link><description>A synthetic permitted excerpt for the browser contract.</description></item></channel></rss>'
const handler=api(s,{sourceFetcher:sourceFetcher(['https://news.example.org'],async()=>new Response(rss,{headers:{'content-type':'application/rss+xml'}}))})
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/auth/me',r=>r.fulfill({json:{actor:owner.actor,csrf:'fixture',steward:false}}))
 await page.route('**/v1/**',async r=>{const q=r.request(),res=await handler(new Request(q.url(),{method:q.method(),headers:{...q.headers(),authorization:'Bearer '+owner.token,origin},...(q.method()==='POST'?{body:q.postData()}: {})}));return r.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.from(await res.arrayBuffer())})})
 await page.goto(origin+'/studio',{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Studio',exact:true}).waitFor()
 await page.getByRole('button',{name:'Tambah',exact:true}).click();await page.getByLabel('Nama sumber').fill('Synthetic reference feed');await page.getByLabel('Alamat RSS, Atom atau JSON Feed').fill('https://news.example.org/rss');await page.getByLabel('Izin penggunaan yang sudah diperiksa').selectOption('excerpt-permitted');await page.getByRole('button',{name:'Simpan sumber'}).click();await page.getByRole('heading',{name:'Synthetic reference feed',exact:true}).waitFor()
 await page.getByRole('button',{name:'Periksa',exact:true}).click();await page.getByRole('heading',{name:'Source-backed browser discovery',exact:true}).waitFor()
 await page.getByRole('button',{name:'Tampilkan',exact:true}).click();await page.getByRole('button',{name:'Buat catatan',exact:true}).click();await page.getByRole('status').filter({hasText:'Catatan dibuat'}).waitFor()
 await page.goto(origin+'/knowledge',{waitUntil:'networkidle'});await page.getByRole('link').filter({hasText:'Source-backed browser discovery'}).click();await page.getByRole('button',{name:'Ajukan ke Wiki'}).click();await page.waitForURL('**/wiki/*');await page.getByRole('heading',{name:'Source-backed browser discovery',exact:true}).waitFor()
 const note=s.get('SELECT * FROM knowledge_notes WHERE community_id=?',room.id);assert.equal(note.state,'promoted');const proposal=new Wiki(s).proposals(owner.actor.id,note.wiki_page_id)[0];assert.equal(proposal.state,'pending');assert.equal(s.get('SELECT count(*) n FROM knowledge_evidence WHERE note_id=?',note.id).n,1)
 await page.screenshot({path:artifactDir+'/living-commons-wiki-mobile.png',fullPage:true})
 for(const [width,height] of [[390,844],[1280,900]]){await page.setViewportSize({width,height});await page.goto(origin+'/studio',{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:artifactDir+'/living-commons-studio-'+width+'.png',fullPage:true})}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({sourceToNoteToWiki:true,realLocalPipeline:true,widths:[390,1280],errors:errors.length,fixtures:'synthetic only; no production mutation'}))
}finally{await browser.close();s.close()}
