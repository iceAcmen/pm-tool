import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
import {centeredPointer,selectPointer,mainPointerSave,observeNativeClicks} from './2026-10-23-f02-gui-r2-helpers.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
let stop,cleanup
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'r2prepare')
  const raw=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/deliverables/dlv-0001.json')).record
  assert.equal(raw.status,'accepted');assert.equal(raw.projectId,'p-0001')
  const nav=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.getClientRects().length&&/^交付物(\s*\d+)?$/.test(n.innerText.trim())))
  assert(nav.asElement());await nav.asElement().click()
  await page.waitForSelector('.dv-d-name h3',{timeout:5000})
  await h.state(page,'r2prepare-deliverable-list')
  const title=await page.evaluateHandle(()=>[...document.querySelectorAll('.dv-d-name h3')].find(n=>n.innerText.trim()==='QA交付物V1'))
  await centeredPointer(h,page,title.asElement(),'r2prepare-open-edit')
  await page.waitForSelector('button[aria-label="交付物状态"]',{timeout:5000})
  await h.state(page,'r2prepare-original-accepted-edit')
  cleanup=await observeNativeClicks(h,page,'r2prepare')
  await selectPointer(h,page,'计划中','r2prepare-planned')
  const before=JSON.parse(await fs.readFile(h.out+'/r2prepare-original-accepted-edit-roots.json'))
  const selected=JSON.parse(await fs.readFile(h.out+'/r2prepare-planned-stable-selection-roots.json'))
  assert.deepEqual(selected,before,'Selection must not write')
  await mainPointerSave(h,page,'r2prepare-planned')
  const saved=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/deliverables/dlv-0001.json')).record
  assert.equal(saved.status,'planned')
  await h.save('r2prepare-fixture-only.json',{at:new Date().toISOString(),scope:'Normal Main form save prepared actual planned initial condition; not F02 accepted first-save verdict',beforeStatus:raw.status,afterStatus:saved.status,selectionRootsEqual:true})
  console.log({fixturePreparation:true,actualDBStatus:saved.status})
}catch(e){
  await h.save('r2prepare-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'r2prepare-error-state')
  throw e
}finally{if(cleanup)await cleanup();if(stop)await stop();await browser.disconnect()}
