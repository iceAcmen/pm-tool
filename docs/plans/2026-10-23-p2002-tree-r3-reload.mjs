import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeR3'),{browser,page}=await h.connect()
const ids=JSON.parse(await fs.readFile(h.out+'/ids.json','utf8'))
const before=JSON.parse(await fs.readFile(h.out+'/round02-prepared-pm-roots.json','utf8'))
let stop
async function capture(name){
  const s=await h.state(page,name)
  assert.deepEqual(JSON.parse(await fs.readFile(h.out+'/'+name+'-roots.json','utf8')),before)
  const rows=await page.evaluate(()=>[...document.querySelectorAll('[data-pm-row]')].map(n=>({
    id:n.getAttribute('data-pm-row'),text:n.innerText,className:n.className,bbox:n.getBoundingClientRect().toJSON(),
    slots:[...n.querySelectorAll('.pm-export-slot')].map(s=>({text:s.innerText,time:s.querySelector('time')?.dateTime,bbox:s.getBoundingClientRect().toJSON()})),
  })))
  await h.save(name+'-rows.json',rows)
  for(const t of Object.values(ids)){
    const row=rows.find(r=>r.id===t.id)
    assert(row);assert.equal(row.slots.length,1);assert.equal(row.slots[0].time,'2026-10-22T21:23:08.315Z')
  }
  return s
}
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round04-reentry-reload')
  await h.textButton(page,'甘特排期')
  await page.waitForSelector('.pm-gantt',{visible:true,timeout:5000})
  const taskButton=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.innerText.trim().startsWith('全部任务')))
  await taskButton.asElement().click()
  await page.waitForSelector('[data-pm-row="'+ids.child_a.id+'"]',{visible:true,timeout:5000})
  const parent=await page.$('[data-pm-row="'+ids.parent.id+'"]')
  await parent.scrollIntoView()
  await capture('round04-tree-reentry')
  const timeBefore=await page.evaluate(()=>performance.timeOrigin)
  await page.reload({waitUntil:'domcontentloaded'})
  await page.waitForSelector('button[aria-label="项目管理"]',{visible:true,timeout:10000})
  await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('[data-pm-row="'+ids.child_a.id+'"]',{visible:true,timeout:10000})
  const afterParent=await page.$('[data-pm-row="'+ids.parent.id+'"]')
  await afterParent.scrollIntoView()
  const after=await capture('round04-tree-after-reload')
  assert.notEqual(after.timeOrigin,timeBefore)
  await h.save('round04-real-reload.json',{before:timeBefore,after:after.timeOrigin,origin:after.origin})
  console.log(JSON.stringify({origin:after.origin,timeBefore,timeAfter:after.timeOrigin,protected47:true}))
}catch(e){await h.save('round04-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
