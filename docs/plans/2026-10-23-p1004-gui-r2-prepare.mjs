import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
import {centeredPointer} from './2026-10-23-f02-gui-r2-helpers.mjs'
const h=createHarness('P1004RepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  assert(!(await page.$('[role=dialog]')))
  stop=await h.record(page,'p1004prepare')
  const raw=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/tasks/t-0006.json')).record
  assert.equal(raw.assignee,'P1004刷新负责人');assert.equal(raw.progress,47)
  await h.state(page,'p1004prepare-original-current')
  await h.save('binding.json',{at:new Date().toISOString(),candidate:'CombinedF02RepairR2',sourceInputs:525,port:3269,pid:22463,runtime:h.runtime,gui:'PENDING',originalContract:'docs/testing/p1-projection-refresh-gui-review-20261023-r1.md §6',normalFixturePreparationOnly:true})
  const nav=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.getClientRects().length&&/^全部任务(\s*\d+)?$/.test(n.innerText.trim())))
  assert(nav.asElement());await nav.asElement().click()
  const selector='button[aria-label="编辑 P0真实采集限流跟进20261023"]'
  await page.waitForSelector(selector,{visible:true,timeout:6000})
  await centeredPointer(h,page,await page.$(selector),'p1004prepare-open-normal-task')
  await page.waitForSelector('input[name="assignee"]',{visible:true,timeout:5000})
  await h.state(page,'p1004prepare-normal-form')
  await page.click('input[name="assignee"]',{clickCount:3})
  await page.keyboard.press('Backspace')
  await page.click('input[name="progress"]',{clickCount:3})
  await page.keyboard.type('0')
  assert.equal(await page.$eval('input[name="assignee"]',n=>n.value),'')
  assert.equal(await page.$eval('input[name="progress"]',n=>n.value),'0')
  await h.state(page,'p1004prepare-normal-unassigned-zero-draft')
  const button=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='保存更改'))
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('task update t-0006'),{timeout:12000})
  await centeredPointer(h,page,button.asElement(),'p1004prepare-normal-main-save')
  const res=await waiting,body=await res.json()
  await h.save('p1004prepare-normal-save-response.json',{status:res.status(),request:JSON.parse(res.request().postData()),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog][aria-label="编辑任务"]'),{timeout:5000})
  await h.state(page,'p1004prepare-zero-actually-saved')
  const saved=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/tasks/t-0006.json')).record
  assert.equal(saved.progress,0);assert.equal(saved.assignee,null)
  await h.save('p1004prepare-fixture-only.json',{at:new Date().toISOString(),taskId:saved.id,originalAssignee:raw.assignee,originalProgress:raw.progress,preparedAssignee:saved.assignee,preparedProgress:saved.progress,source:'Normal production TaskForm and unique Main pointer save; no direct database seed',independentGUI:'PENDING'})
  console.log({fixturePreparation:true,taskId:saved.id,assignee:saved.assignee,progress:saved.progress})
}catch(e){
  await h.save('p1004prepare-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'p1004prepare-error-state')
  throw e
}finally{if(stop)await stop();await browser.disconnect()}
