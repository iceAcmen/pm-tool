import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try{
  stop=await h.record(page,'round15')
  await page.click('[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{timeout:8000})
  const button=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.getClientRects().length&&/^交付物(\s*\d+)?$/.test(n.innerText.trim())))
  assert(button.asElement());await button.asElement().click()
  await page.waitForSelector('.dv-d-name h3',{timeout:5000})
  await h.state(page,'round15-deliverable-list')
  await page.click('.dv-d-name h3')
  await page.waitForSelector('button[aria-label="交付物状态"]',{timeout:5000})
  const ui=await h.state(page,'round15-deliverable-edit')
  console.log({dialogs:ui.dialogs,fields:ui.fields,buttons:ui.buttons.slice(-16)})
}catch(e){await h.state(page,'round15-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
