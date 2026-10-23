import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round08-project-isolation')
  await h.textButton(page,'QA-B-fixture-F5\np-0002 · 2026-01-01')
  await page.waitForFunction(()=>document.querySelector('.pm-shell')?.innerText.includes('QA-B任务'),{timeout:10000})
  await h.state(page,'round08-b-tasks')
  const rows=await page.$$eval('[data-pm-row]',nodes=>nodes.map(n=>({id:n.getAttribute('data-pm-row'),text:n.innerText,slot:[...n.querySelectorAll('.pm-export-slot')].map(s=>({text:s.innerText,time:s.querySelector('time')?.dateTime}))})))
  await h.save('round08-b-slot-rows.json',rows)
  assert.equal(rows.length,1);assert.equal(rows[0].id,'t-0002');assert.equal(rows[0].slot[0].text,'未导出')
  await page.click('[data-pm-row="t-0002"] .pt-acts button')
  await page.waitForSelector('[role="dialog"] input[name="title"]',{visible:true,timeout:10000})
  await h.state(page,'round08-b-edit-visible')
  await page.keyboard.press('Escape')
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'),{timeout:10000})
  await h.state(page,'round08-b-cancel')
  await page.click('button[aria-label="刷新数据"]')
  await h.state(page,'round08-b-refresh')
  await h.textButton(page,'QA-B-fixture-F5')
  await h.textButton(page,'QA-A-fixture-F5\np-0001 · 2026-01-01')
  await page.waitForSelector('[data-pm-row="t-0007"]',{timeout:10000})
  await h.state(page,'round08-a-reentry')
  console.log(JSON.stringify({b:rows,aSlots:await page.$$eval('.pm-export-slot time',n=>n.map(s=>s.dateTime))}))
}catch(e){await h.save('round08-error.json',{error:String(e),stack:e.stack});await h.state(page,'round08-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
