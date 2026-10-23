import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round08')
  await page.click('.pm-restore-confirm')
  await page.waitForSelector('[role=dialog]',{timeout:4000})
  await h.state(page,'round08-explicit-confirm')
  const button=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='确认恢复'))
  assert(button.asElement())
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('/pm restore '),{timeout:12000})
  await button.asElement().click()
  const response=await waiting,body=await response.json()
  await h.save('round08-restore-response.json',{status:response.status(),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>document.querySelector('.pm-shell')?.innerText.includes('QA-G A'),{timeout:6000})
  const ui=await h.state(page,'round08-restored')
  console.log({text:ui.text?.slice(0,2200),fields:ui.fields,dialogs:ui.dialogs,viewport:ui.viewport})
} catch(e) {await h.state(page,'round08-error-state');throw e}
finally {if(stop)await stop();await browser.disconnect()}
