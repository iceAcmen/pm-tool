import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2007ArchiveRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const before=await h.state(page,'round05-before-reentry')
  stop=await h.record(page,'round05-reentry-review')
  await page.reload({waitUntil:'load',timeout:15000})
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
  await page.waitForFunction(()=>document.body.innerText.includes('复盘已核（known）句：9 条'),{timeout:10000})
  const after=await h.state(page,'round05-reentered-original-session')
  assert.notEqual(after.timeOrigin,before.timeOrigin)
  const old=await page.evaluate(()=>({at:new Date().toISOString(),origin:location.origin,pathname:location.pathname,timeOrigin:performance.timeOrigin,text:document.body.innerText}))
  assert(old.text.includes('/pm archive p-0001 p2007-archive-repair-gui-r2'))
  assert(old.text.includes(h.runtime+'/exports/p2007-archive-repair-gui-r2'))
  await h.save('round05-reentered-command-readout.json',old)
  const review=await h.command(page,'/pm review p-0001 2026-10-16 2026-10-23','round05-review-reread')
  assert.equal(review.result.value.result.kind,'success')
  const prior=JSON.parse(await fs.readFile(h.out+'/round02-review-command.json'))
  assert.equal(review.result.value.result.text,prior.body.result.value.result.text)
  await h.state(page,'round05-after-review-reread')
  await h.save('round05-reentry-observations.json',{beforeTimeOrigin:before.timeOrigin,afterTimeOrigin:after.timeOrigin,originalArchiveReadoutPreserved:true,reviewTextSame:true,newArchiveWrites:0})
  console.log({realReload:true,timeOriginChanged:true,originalArchiveReadoutPreserved:true,reviewTextSame:true})
}catch(e){await h.save('round05-error.json',{error:String(e),stack:e.stack});await h.state(page,'round05-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
