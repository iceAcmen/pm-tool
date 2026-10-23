import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round06-a-grouped')
  await h.state(page,'round06-before')
  await h.textButton(page,'按状态分组')
  await page.waitForSelector('.pm-task-row',{visible:true,timeout:10000})
  await h.state(page,'round06-grouped')
  const rows=await page.$$eval('[data-pm-row]',nodes=>nodes.map(n=>({id:n.getAttribute('data-pm-row'),className:n.className,text:n.innerText,slot:[...n.querySelectorAll('.pm-export-slot')].map(s=>({text:s.innerText,at:s.querySelector('time')?.dateTime,bbox:s.getBoundingClientRect().toJSON()}))})))
  await h.save('round06-grouped-rows.json',rows)
  assert.equal(rows.length,7)
  assert(rows.every(n=>n.slot.length===1&&n.slot[0].at==='2026-10-22T21:23:08.315Z'))
  await(await page.$('[data-pm-row="t-0007"]')).scrollIntoView()
  await h.state(page,'round06-grouped-long-visible')
  await page.click('[data-pm-row="t-0007"] .pt-acts button')
  await page.waitForSelector('[role="dialog"] input[name="title"]',{visible:true,timeout:10000})
  await h.state(page,'round06-grouped-edit-visible')
  await page.keyboard.press('Escape')
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'),{timeout:10000})
  await h.state(page,'round06-grouped-cancel')
  console.log(JSON.stringify({rows:rows.map(n=>({id:n.id,at:n.slot[0].at})),missingHierarchy:'当前7个A任务parentId均null；本轮不伪称子层/折叠展开已测'}))
}catch(e){await h.save('round06-error.json',{error:String(e),stack:e.stack});await h.state(page,'round06-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
