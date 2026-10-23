import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round22')
  await page.click('[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{timeout:8000})
  const before=await h.state(page,'round22-before-select-E')
  console.log(JSON.stringify({buttons:before.buttons,fields:before.fields}))
  const picker=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.getClientRects().length&&n.innerText.trim()==='QA-A-fixture-F5'))
  assert(picker.asElement());await picker.asElement().click()
  const opened=await h.state(page,'round22-project-picker-open')
  const options=await page.evaluate(()=>[...document.querySelectorAll('[role=option],button')].filter(n=>n.getClientRects().length&&n.innerText.includes('QA-E-habit-negative-20261023')).map(n=>({tag:n.tagName,role:n.getAttribute('role'),text:n.innerText,bbox:n.getBoundingClientRect().toJSON()})))
  await h.save('round22-E-picker-targets.json',options)
  console.log(JSON.stringify({dialogs:opened.dialogs,options}))
} catch(e) {
  await h.save('round22-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round22-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}
