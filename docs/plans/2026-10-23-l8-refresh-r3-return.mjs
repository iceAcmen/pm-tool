import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {h,repo,state} from './2026-10-23-l8-refresh-r3-helper.mjs'
const {browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3263')
  stop=await h.record(page,'round04-return-current')
  await state(page,'round04-original-final')
  await page.goto(await fs.readFile(h.runtime+'/private/l8-r3-return-url','utf8'),{waitUntil:'domcontentloaded'})
  await page.waitForSelector('button[aria-label="项目管理"]',{visible:true,timeout:10000})
  await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{visible:true,timeout:10000})
  const s=await h.state(page,'round04-current-final')
  const r=JSON.parse(await fs.readFile(h.out+'/round04-current-final-roots.json','utf8'))
  const original=JSON.parse(await fs.readFile(repo+'/reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/round10-final-a-roots.json','utf8'))
  assert.deepEqual(r,original)
  await h.save('round04-return-protection.json',{origin:s.origin,current44RootsEqualP2Final:true,count:Object.keys(r).length})
  console.log(JSON.stringify({returned:s.origin,protectedRoots:Object.keys(r).length}))
}catch(e){await h.save('round04-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
