import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try{
  stop=await h.record(page,'round18')
  await page.click('.dv-d-name h3')
  await page.waitForSelector('button[aria-label="交付物状态"]',{timeout:5000})
  await h.state(page,'round18-planned-edit-initial')
  await page.focus('button[aria-label="交付物状态"]')
  await page.click('button[aria-label="交付物状态"]')
  await page.waitForSelector('[role=option]',{visible:true,timeout:4000})
  await h.state(page,'round18-planned-menu')
  const option=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.trim()==='已验收'))
  assert(option.asElement())
  await h.save('round18-option-pointer-target.json',await option.asElement().evaluate(n=>({text:n.innerText,bbox:n.getBoundingClientRect().toJSON()})))
  await option.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('.rb-lb-menu'),{timeout:4000})
  await h.state(page,'round18-accepted-before-main-save')
  const save=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='保存更改'))
  assert(save.asElement())
  await save.asElement().scrollIntoView()
  await h.save('round18-save-pointer-target.json',await save.asElement().evaluate(n=>{
    const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
    return {text:n.innerText,bbox:b.toJSON(),hit:{tag:hit?.tagName,text:hit?.innerText},hitIsButton:hit===n||n.contains(hit)}
  }))
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('deliverable update dlv-0001'),{timeout:12000})
  await save.asElement().click()
  const res=await waiting,body=await res.json()
  await h.save('round18-main-pointer-save.json',{status:res.status(),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog][aria-label="编辑交付物"]'),{timeout:5000})
  const ui=await h.state(page,'round18-accepted-after-main-save')
  console.log({dialogs:ui.dialogs,tail:ui.text?.slice(-1800)})
}catch(e){await h.state(page,'round18-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
