import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try{
  stop=await h.record(page,'round17')
  const option=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.trim()==='计划中'))
  assert(option.asElement());await option.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('.rb-lb-menu'),{timeout:4000})
  await h.state(page,'round17-fixture-planned-before-save')
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('deliverable update dlv-0001'),{timeout:12000})
  await h.textButton(page,'保存更改')
  const res=await waiting,body=await res.json()
  await h.save('round17-fixture-planned-save.json',{fixturePreparationOnly:true,status:res.status(),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog][aria-label="编辑交付物"]'),{timeout:5000})
  const ui=await h.state(page,'round17-fixture-planned-after-save')
  console.log({fixture:'Original pointer planned→accepted precondition prepared through normal Main form',dialogs:ui.dialogs,text:ui.text?.slice(-1600)})
}catch(e){await h.state(page,'round17-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
