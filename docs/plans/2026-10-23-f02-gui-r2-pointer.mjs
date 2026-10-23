import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
import {centeredPointer,selectPointer,mainPointerSave,observeNativeClicks} from './2026-10-23-f02-gui-r2-helpers.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
let stop,cleanup
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'r2pointer')
  const raw=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/deliverables/dlv-0001.json')).record
  assert.equal(raw.status,'planned')
  const title=await page.evaluateHandle(()=>[...document.querySelectorAll('.dv-d-name h3')].find(n=>n.innerText.trim()==='QA交付物V1'))
  await centeredPointer(h,page,title.asElement(),'r2pointer-open-edit')
  await page.waitForSelector('button[aria-label="交付物状态"]',{timeout:5000})
  await h.state(page,'r2pointer-planned-edit')
  cleanup=await observeNativeClicks(h,page,'r2pointer')
  await selectPointer(h,page,'已验收','r2pointer-accepted')
  const before=JSON.parse(await fs.readFile(h.out+'/r2pointer-planned-edit-roots.json'))
  const selected=JSON.parse(await fs.readFile(h.out+'/r2pointer-accepted-stable-selection-roots.json'))
  assert.deepEqual(selected,before,'Selection must not write')
  await mainPointerSave(h,page,'r2pointer-accepted')
  const saved=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/deliverables/dlv-0001.json')).record
  assert.equal(saved.status,'accepted')
  const after=JSON.parse(await fs.readFile(h.out+'/r2pointer-accepted-closed-after-save-roots.json'))
  const changes=Object.keys({...before,...after}).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]))
  assert.deepEqual(changes,['data/pmtool/deliverables/dlv-0001.json'])
  const reopen=await page.evaluateHandle(()=>[...document.querySelectorAll('.dv-d-name h3')].find(n=>n.innerText.trim()==='QA交付物V1'))
  await centeredPointer(h,page,reopen.asElement(),'r2pointer-normal-reopen')
  await page.waitForSelector('button[aria-label="交付物状态"]',{timeout:5000})
  const ui=await h.state(page,'r2pointer-accepted-reopened')
  assert((await page.$eval('#deliverable-status',n=>n.innerText)).includes('已验收'))
  assert.deepEqual(JSON.parse(await fs.readFile(h.out+'/r2pointer-accepted-reopened-roots.json')),after)
  await h.save('r2pointer-observations.json',{at:new Date().toISOString(),selectionRootsEqual:true,actualDBStatus:saved.status,changes,firstMainPointerSaveAttempts:1,normalReopen:true,independentGUI:'PENDING'})
  console.log({actualDBStatus:saved.status,changes,dialogs:ui.dialogs.map(n=>n.label),firstMainPointerSaveAttempts:1})
}catch(e){
  await h.save('r2pointer-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'r2pointer-error-state')
  throw e
}finally{if(cleanup)await cleanup();if(stop)await stop();await browser.disconnect()}
