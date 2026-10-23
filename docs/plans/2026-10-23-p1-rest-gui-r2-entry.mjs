import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-p1-history-harness-20261023-r1.mjs'
const h=createHarness('P1RestVisibleR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  await fs.writeFile(h.runtime+'/private/rest-r2-return-url',page.url(),{flag:'wx',mode:0o600})
  stop=await h.record(page,'round01-entry')
  await h.state(page,'round01-history-root-before')
  await page.goto(await fs.readFile(h.runtime+'/private/entry-url','utf8'),{waitUntil:'domcontentloaded',timeout:15000})
  await page.waitForSelector('button[aria-label="项目管理"]',{visible:true,timeout:10000})
  if(!await page.$('.pm-shell'))await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{visible:true,timeout:10000})
  await h.state(page,'round01-history-current')
  await h.textButton(page,'总览看板')
  await page.waitForSelector('.pm-queue-card',{visible:true,timeout:10000})
  await h.state(page,'round01-queue-current')
  const q=await page.evaluate(()=>({
    rows:[...document.querySelectorAll('.pm-queue-row')].map(n=>({text:n.innerText,title:n.querySelector('.pm-queue-title')?.innerText,bbox:n.getBoundingClientRect().toJSON()})),
    toggle:[...document.querySelectorAll('.pm-queue-toggle')].map(n=>({text:n.innerText,aria:n.getAttribute('aria-expanded')})),
    buttons:[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length).map(n=>({text:n.innerText,aria:n.getAttribute('aria-label')}))
  }))
  await h.save('round01-queue-observation.json',q)
  console.log(JSON.stringify({origin:new URL(page.url()).origin,q}))
}catch(e){await h.save('round01-error.json',{error:String(e),stack:e.stack});await h.state(page,'round01-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
