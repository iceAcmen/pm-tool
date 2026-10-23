import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeRefreshR4'),repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const previous=repo+'/reports/all-pending-evidence-20261021/P2002TreeR3'
const ids=JSON.parse(await fs.readFile(previous+'/ids.json','utf8'))
const baseline=JSON.parse(await fs.readFile(previous+'/round04-tree-after-reload-roots.json','utf8'))
await h.save('original-ids.json',ids)
await h.save('original-final-roots.json',baseline)
for(const n of ['candidate.json','source-files.json','complete-inputs.json','built-artifacts.json','activation-binding.json']){
  await h.save(n,await fs.readFile(previous+'/'+n,'utf8'))
}
await h.save('original-r3-report.md',await fs.readFile(repo+'/docs/testing/p2002-tree-gui-review-20261023-r3-report.md','utf8'))
const {browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round01-refreshed-tree-visible')
  await h.state(page,'round01-before-refresh')
  assert.deepEqual(JSON.parse(await fs.readFile(h.out+'/round01-before-refresh-roots.json','utf8')),baseline)
  const waiting=page.waitForResponse(r=>{
    if(new URL(r.url()).pathname!=='/api/commands/execute')return false
    try{return JSON.parse(r.request().postData()).payload.args.line==='/pm web snapshot'}catch{return false}
  },{timeout:15000})
  await page.click('button[aria-label="刷新数据"]')
  const response=await waiting
  await h.save('round01-refresh-snapshot.json',{status:response.status(),body:await response.json()})
  const parent=await page.$('[data-pm-row="'+ids.parent.id+'"]')
  assert(parent);await parent.scrollIntoView()
  const s=await h.state(page,'round01-after-refresh-tree-visible')
  assert.deepEqual(JSON.parse(await fs.readFile(h.out+'/round01-after-refresh-tree-visible-roots.json','utf8')),baseline)
  const rows=await page.evaluate(()=>[...document.querySelectorAll('[data-pm-row]')].map(n=>({
    id:n.getAttribute('data-pm-row'),text:n.innerText,bbox:n.getBoundingClientRect().toJSON(),
    slots:[...n.querySelectorAll('.pm-export-slot')].map(s=>({text:s.innerText,at:s.querySelector('time')?.dateTime,bbox:s.getBoundingClientRect().toJSON()})),
  })))
  await h.save('round01-after-refresh-rows.json',rows)
  for(const t of Object.values(ids)){
    const row=rows.find(r=>r.id===t.id)
    assert(row);assert.equal(row.slots.length,1);assert.equal(row.slots[0].at,'2026-10-22T21:23:08.315Z')
    assert(row.slots[0].bbox.y>=0&&row.slots[0].bbox.bottom<=s.viewport.innerHeight)
  }
  console.log(JSON.stringify({origin:s.origin,protected47:true,ids:Object.values(ids).map(t=>t.id),rows:rows.filter(r=>Object.values(ids).some(t=>t.id===r.id))}))
}catch(e){await h.save('capture-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
