import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
import {centeredPointer,observeNativeClicks} from './2026-10-23-f02-gui-r2-helpers.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
let stop,cleanup
const tabs=[]
async function tabTo(predicate){
  for(let count=0;count<18;count++){
    const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,text:document.activeElement?.textContent?.trim(),aria:document.activeElement?.getAttribute('aria-label')}))
    tabs.push(focus)
    if(predicate(focus))return
    await page.keyboard.press('Tab')
  }
  throw new Error('Native Tab did not reach the expected control; no programmatic focus fallback')
}
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'r2keyboard')
  cleanup=await observeNativeClicks(h,page,'r2keyboard')
  assert(await page.$('[role=dialog][aria-label="编辑交付物"]'))
  await h.state(page,'r2keyboard-reopened-before')
  await tabTo(f=>f.id==='deliverable-status')
  await h.state(page,'r2keyboard-status-native-focus')
  await page.keyboard.press('Enter')
  await page.waitForSelector('[role=option]',{visible:true,timeout:4000})
  await h.state(page,'r2keyboard-menu')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForFunction(()=>!document.querySelector('.rb-lb-menu')&&!document.querySelector('.rb-lb-backdrop')&&document.querySelector('#deliverable-status')?.getAttribute('aria-expanded')==='false',{timeout:4000})
  await h.state(page,'r2keyboard-accepted-selected')
  assert((await page.$eval('#deliverable-status',n=>n.innerText)).includes('已验收'))
  assert.deepEqual(JSON.parse(await fs.readFile(h.out+'/r2keyboard-reopened-before-roots.json')),JSON.parse(await fs.readFile(h.out+'/r2keyboard-accepted-selected-roots.json')))
  await tabTo(f=>f.tag==='BUTTON'&&f.text==='保存更改')
  await h.state(page,'r2keyboard-main-save-native-focus')
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('deliverable update dlv-0001'),{timeout:12000})
  await page.keyboard.press('Enter')
  const res=await waiting,body=await res.json()
  await h.save('r2keyboard-main-save-response.json',{status:res.status(),request:JSON.parse(res.request().postData()),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog][aria-label="编辑交付物"]'),{timeout:5000})
  await h.state(page,'r2keyboard-closed-after-save')
  const title=await page.evaluateHandle(()=>[...document.querySelectorAll('.dv-d-name h3')].find(n=>n.innerText.trim()==='QA交付物V1'))
  await centeredPointer(h,page,title.asElement(),'r2keyboard-normal-reopen')
  await page.waitForSelector('#deliverable-status',{timeout:5000})
  await h.state(page,'r2keyboard-accepted-reopened')
  assert((await page.$eval('#deliverable-status',n=>n.innerText)).includes('已验收'))
  const cancel=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='取消'))
  await centeredPointer(h,page,cancel.asElement(),'r2keyboard-normal-cancel')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog]'),{timeout:5000})
  await h.state(page,'r2keyboard-final-normal-exit')
  await h.save('r2keyboard-native-tabs.json',{tabs,keyboardSaveAttempts:1,pointerAcceptedSaveUsedAsControl:false,independentGUI:'PENDING'})
  console.log({keyboardSaveAttempts:1,kind:body.result.value.result.kind,finalDialogs:0,nativeTabs:tabs.length})
}catch(e){
  await h.save('r2keyboard-error.json',{error:String(e),stack:e.stack,tabs})
  await h.state(page,'r2keyboard-error-state')
  throw e
}finally{if(cleanup)await cleanup();if(stop)await stop();await browser.disconnect()}
