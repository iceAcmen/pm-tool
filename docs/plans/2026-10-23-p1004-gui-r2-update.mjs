import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
import {centeredPointer} from './2026-10-23-f02-gui-r2-helpers.mjs'
const h=createHarness('P1004RepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'p1004update')
  await h.state(page,'p1004update-old-answer-before-human-change')
  await page.click('button[aria-label="最小化为侧边标签（保留上下文）"]')
  const selector='button[aria-label="编辑 P0真实采集限流跟进20261023"]'
  await centeredPointer(h,page,await page.$(selector),'p1004update-open-normal-form')
  await page.waitForSelector('input[name="assignee"]',{visible:true,timeout:5000})
  assert.equal(await page.$eval('input[name="assignee"]',n=>n.value),'')
  await page.click('input[name="assignee"]')
  await page.keyboard.type('P1004刷新负责人')
  await page.click('input[name="progress"]',{clickCount:3})
  await page.keyboard.type('47')
  await h.state(page,'p1004update-human-draft-not-saved')
  const button=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='保存更改'))
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('task update t-0006'),{timeout:12000})
  await centeredPointer(h,page,button.asElement(),'p1004update-main-human-save')
  const res=await waiting,body=await res.json()
  await h.save('p1004update-normal-save-response.json',{status:res.status(),request:JSON.parse(res.request().postData()),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog][aria-label="编辑任务"]'),{timeout:5000})
  const saved=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/tasks/t-0006.json')).record
  assert.equal(saved.progress,47);assert.equal(saved.assignee,'P1004刷新负责人')
  await page.click('button[aria-label="展开 AI 副驾，保留此前上下文"]')
  await h.state(page,'p1004update-old-answer-after-human-save')
  const refresh=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-sidecar button')].find(n=>n.innerText.trim()==='刷新'))
  const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('/pm web snapshot'),{timeout:12000})
  await centeredPointer(h,page,refresh.asElement(),'p1004update-readonly-refresh')
  const response=await responsePromise
  await h.save('p1004update-projection-refresh-response.json',{status:response.status(),request:JSON.parse(response.request().postData()),body:await response.json()})
  await page.waitForFunction(()=>document.querySelector('.pm-sidecar')?.innerText.includes('负责人：P1004刷新负责人'),{timeout:5000})
  const text=await page.$eval('.pm-sidecar',n=>n.innerText)
  assert(text.includes('负责人未指派、进度0%'))
  await h.save('p1004update-old-answer-latest-projection.json',{text,oldAnswerPreserved:true,actualTask:saved})
  await h.state(page,'p1004update-refreshed-old-answer-latest-card')
  const open=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-sidecar button')].find(n=>n.innerText.trim()==='打开任务'))
  await centeredPointer(h,page,open.asElement(),'p1004update-first-open-task-from-projection')
  await page.waitForSelector('[role=dialog][aria-label="编辑任务"]',{timeout:5000})
  await h.state(page,'p1004update-first-target-open')
  await page.waitForFunction(()=>{
    const n=document.activeElement
    if(!(n instanceof HTMLInputElement)||n.name!=='title')return false
    const b=n.getBoundingClientRect()
    return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===n
  },{timeout:5000})
  const target=await page.evaluate(()=>{
    const n=document.activeElement,b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
    return {focus:{tag:n.tagName,name:n.name,value:n.value,bbox:b.toJSON()},hit:{tag:hit?.tagName,name:hit?.getAttribute('name')},focusCenterHit:hit===n,sidecarHidden:document.querySelector('.pm-sidecar')?.hidden,dialogs:[...document.querySelectorAll('[role=dialog]')].map(n=>({label:n.getAttribute('aria-label'),bbox:n.getBoundingClientRect().toJSON()}))}
  })
  await h.save('p1004update-first-focus-real-target.json',target)
  assert(target.focusCenterHit);assert(target.sidecarHidden)
  await h.state(page,'p1004update-first-target-unobstructed')
  console.log({oldAnswerPreserved:true,taskId:saved.id,progress:saved.progress,firstFocusTarget:target.focus.name,sidecarHidden:target.sidecarHidden})
}catch(e){
  await h.save('p1004update-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'p1004update-error-state')
  throw e
}finally{if(stop)await stop();await browser.disconnect()}
