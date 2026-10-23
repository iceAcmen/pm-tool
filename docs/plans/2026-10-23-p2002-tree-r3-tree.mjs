import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeR3'),{browser,page}=await h.connect()
const ids=JSON.parse(await fs.readFile(h.out+'/ids.json','utf8'))
const baseline=JSON.parse(await fs.readFile(h.out+'/round02-prepared-pm-roots.json','utf8'))
let stop
async function capture(name){
  await h.state(page,name)
  const r=JSON.parse(await fs.readFile(h.out+'/'+name+'-roots.json','utf8'))
  assert.deepEqual(r,baseline)
  const rows=await page.evaluate(()=>[...document.querySelectorAll('[data-pm-row]')].map(n=>({
    id:n.getAttribute('data-pm-row'),className:n.className,text:n.innerText,bbox:n.getBoundingClientRect().toJSON(),
    slots:[...n.querySelectorAll('.pm-export-slot')].map(s=>({text:s.innerText,bbox:s.getBoundingClientRect().toJSON(),time:s.querySelector('time')?{at:s.querySelector('time').dateTime,text:s.querySelector('time').innerText,title:s.querySelector('time').title}:null})),
    edit:[...n.querySelectorAll('.pt-acts button')].map(b=>({aria:b.getAttribute('aria-label'),bbox:b.getBoundingClientRect().toJSON()})),
  })))
  await h.save(name+'-rows.json',rows)
  return rows
}
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round03-real-tree')
  const parent=await page.$('[data-pm-row="'+ids.parent.id+'"]')
  assert(parent);await parent.scrollIntoView()
  const expanded=await capture('round03-tree-expanded')
  for(const t of Object.values(ids)){
    const row=expanded.find(r=>r.id===t.id)
    assert(row);assert.equal(row.slots.length,1)
    assert.equal(row.slots[0].time.at,'2026-10-22T21:23:08.315Z')
  }
  await page.click('button[aria-label="折叠 '+ids.parent.title+'"]')
  const collapsed=await capture('round03-tree-collapsed')
  assert(collapsed.some(r=>r.id===ids.parent.id))
  assert(!collapsed.some(r=>r.id===ids.child_a.id||r.id===ids.child_b.id))
  await page.click('button[aria-label="展开 '+ids.parent.title+'"]')
  await capture('round03-tree-reexpanded')
  await page.click('button[aria-label="编辑 '+ids.child_a.title+'"]')
  await page.waitForSelector('[role=dialog] input[name=title]',{visible:true,timeout:5000})
  await capture('round03-child-edit-visible')
  await page.keyboard.press('Escape')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog]'),{timeout:5000})
  await capture('round03-child-edit-cancelled')
  const waiting=page.waitForResponse(r=>{
    if(new URL(r.url()).pathname!=='/api/commands/execute')return false
    try{return JSON.parse(r.request().postData()).payload.args.line==='/pm web snapshot'}catch{return false}
  },{timeout:15000})
  await page.click('button[aria-label="刷新数据"]')
  const res=await waiting
  await h.save('round03-refresh-snapshot.json',{status:res.status(),body:await res.json()})
  await capture('round03-tree-refreshed')
  console.log(JSON.stringify({realParent:ids.parent.id,children:[ids.child_a.id,ids.child_b.id],readPhaseRootsUnchanged:Object.keys(baseline).length}))
}catch(e){await h.save('round03-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
