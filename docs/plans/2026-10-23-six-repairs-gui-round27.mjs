import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round27')
  await h.state(page,'round27-current-after-readiness-failure')
  const picker=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.innerText.trim()==='QA-E-habit-negative-20261023'))
  assert(picker.asElement());await picker.asElement().click()
  await page.waitForSelector('[role=option]',{visible:true,timeout:5000})
  const A=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.includes('QA-A-fixture-F5')))
  assert(A.asElement());await A.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('[role=listbox]'),{timeout:5000})
  const deliverables=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>/^交付物(\s*\d+)?$/.test(n.innerText.trim())))
  assert(deliverables.asElement());await deliverables.asElement().click()
  await page.waitForSelector('.dv-d-name h3',{visible:true,timeout:5000})
  await h.state(page,'round27-original-deliverable-list')
  await page.click('.dv-d-name h3')
  await page.waitForSelector('button[aria-label="交付物状态"]',{visible:true,timeout:5000})
  const ui=await h.state(page,'round27-original-deliverable-diagnostic-start')
  console.log(JSON.stringify({dialogs:ui.dialogs,fields:ui.fields}))
} catch(e) {
  await h.save('round27-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round27-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}
