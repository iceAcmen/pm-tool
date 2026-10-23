import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round20')
  const before=await h.state(page,'round20-current-pointer-before-leaving')
  assert.equal(before.origin,'http://127.0.0.1:3268')
  assert(before.dialogs.some(d=>d.text.includes('交付物')))
  const cancel=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='取消'))
  assert(cancel.asElement())
  await cancel.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('[role=dialog]'),{timeout:6000})
  const after=await h.state(page,'round20-after-normal-pointer-cancel')
  console.log(JSON.stringify({origin:after.origin,dialogs:after.dialogs,buttons:after.buttons,fields:after.fields}))
} catch(e) {
  await h.save('round20-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round20-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}
