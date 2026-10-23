import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2007ArchiveRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const before=JSON.parse(await fs.readFile(h.out+'/round05-before-reentry.json'))
  const after=await h.state(page,'round06-after-original-reload')
  assert.notEqual(after.timeOrigin,before.timeOrigin)
  const host=await page.evaluate(()=>({at:new Date().toISOString(),origin:location.origin,pathname:location.pathname,timeOrigin:performance.timeOrigin,text:document.body.innerText,editables:[...document.querySelectorAll('[contenteditable=true]')].map(n=>({visible:!!n.getClientRects().length,text:n.innerText}))}))
  await h.save('round06-reentered-host-before-reread.json',host)
  stop=await h.record(page,'round06-review-reread')
  const review=await h.command(page,'/pm review p-0001 2026-10-16 2026-10-23','round06-review-reread')
  assert.equal(review.result.value.result.kind,'success')
  const prior=JSON.parse(await fs.readFile(h.out+'/round02-review-command.json'))
  assert.equal(review.result.value.result.text,prior.body.result.value.result.text)
  await h.state(page,'round06-after-review-reread')
  await h.save('round06-reentry-observations.json',{beforeTimeOrigin:before.timeOrigin,afterTimeOrigin:after.timeOrigin,reviewTextSame:true,archiveWrites:0,priorReadoutPresent:host.text.includes('复盘已核（known）句：9 条'),priorFacility:'Original reload succeeded; executor incorrectly waited for ephemeral new-conversation command output to survive reload. Original timeout preserved; no second reload or archive write.'})
  await stop();stop=null
  const target=JSON.parse(await fs.readFile(h.out+'/round03-owned-file-tab.json')).targetId
  const filePage=await browser.targets().find(t=>t._targetId===target)?.page()
  assert(filePage)
  const dir=h.runtime+'/exports/p2007-archive-repair-gui-r2'
  await filePage.goto('file://'+dir+'/package.json',{waitUntil:'load',timeout:15000})
  const file=await filePage.evaluate(()=>({at:new Date().toISOString(),url:location.href,title:document.title,text:document.body.innerText,timeOrigin:performance.timeOrigin}))
  assert.equal(file.text,await fs.readFile(dir+'/package.json','utf8'))
  await h.save('round06-archive-file-reread.json',file)
  await filePage.screenshot({path:h.out+'/round06-archive-file-reread.png'})
  await page.bringToFront()
  await h.state(page,'round06-final-readonly-state')
  console.log({realOriginalReload:true,timeOriginChanged:true,reviewTextSame:true,originalFileReread:true,archiveWrites:0,priorReadoutPresent:host.text.includes('复盘已核（known）句：9 条')})
}catch(e){await h.save('round06-error.json',{error:String(e),stack:e.stack});await h.state(page,'round06-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
