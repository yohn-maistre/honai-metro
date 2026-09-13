import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base='https://etnos-native.etnos-native-lab.pages.dev';
await mkdir('etnos-evidence',{recursive:true});
const browser=await chromium.launch();
const report=[];
try {
for (const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
 const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
  const feedResponse=page.waitForResponse(r=>r.url().startsWith('https://piefed.social/api/alpha/post/list')&&r.status()===200,{timeout:60000});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const feed=await (await feedResponse).json();assert.ok(feed.posts?.length,'PieFed feed is empty');
  const post=page.locator('a[href*="/post/"]').first();
  await post.waitFor({state:'visible',timeout:60000});
  const href=await post.getAttribute('href');
  await page.screenshot({path:`etnos-evidence/${name}-forum.png`,fullPage:true});
  await post.click();
  await page.waitForURL(/\/post\//,{timeout:30000});
  await page.locator('main').waitFor({timeout:30000});
  await page.screenshot({path:`etnos-evidence/${name}-thread.png`,fullPage:true});
  const data=await context.request.get(base+'/api/etnos/watch/current');assert.equal(data.status(),200);
  const news=await data.json();assert.ok(news.items.length);const title=news.items[0].title.id;
  await page.goto(base+'/explore',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:title,exact:true}).waitFor({timeout:45000});
  await page.screenshot({path:`etnos-evidence/${name}-news.png`,fullPage:true});
  await page.getByRole('heading',{name:title,exact:true}).getByRole('link').click();
  await page.waitForURL(/\/explore\/news\//);
  await page.getByRole('heading',{name:title,exact:true}).waitFor({timeout:30000});
  await page.screenshot({path:`etnos-evidence/${name}-story.png`,fullPage:true});
  await page.goto(base+'/explore',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Isu',exact:true}).click();
  await page.locator('.issue-tile').first().waitFor({timeout:30000});
  await page.screenshot({path:`etnos-evidence/${name}-issues.png`,fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  assert.equal(overflow,false,'horizontal overflow');
  assert.deepEqual(errors,[],'uncaught browser errors');
  report.push({name,passed:true,forumPost:href,engineStory:news.items[0].id});
 } catch(e) {await page.screenshot({path:`etnos-evidence/${name}-failure.png`,fullPage:true});report.push({name,passed:false,error:e.message,errors,body:(await page.locator('body').innerText()).slice(0,5000)});}
 await context.close();
}
} finally {await browser.close();await writeFile('etnos-evidence/report.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
assert.ok(report.every(r=>r.passed),'browser journey failed');
