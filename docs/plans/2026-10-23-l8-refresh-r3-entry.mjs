import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {h,runtime,copyBindings,roots,sameOriginal,state} from './2026-10-23-l8-refresh-r3-helper.mjs'
await copyBindings()
await sameOriginal(await roots('round00-original-protected'))
const {browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  await fs.writeFile(h.runtime+'/private/l8-r3-return-url',page.url(),{flag:'wx',mode:0o600})
  await h.state(page,'round00-current-protected')
  stop=await h.record(page,'round01-original-entry')
  await page.goto(await fs.readFile(runtime+'/private/entry-url','utf8'),{waitUntil:'domcontentloaded'})
  await page.waitForSelector('button[aria-label="项目管理"]',{visible:true,timeout:10000})
  await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{visible:true,timeout:10000})
  const s=await state(page,'round01-original-pm')
  await sameOriginal(s.r)
  console.log(JSON.stringify({origin:s.ui.origin,text:s.ui.text,controls:s.ui.controls}))
}catch(e){await h.save('round01-entry-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
