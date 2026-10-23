import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3268')
  stop=await h.record(page,'round04')
  const later=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim()==='稍后再说'))
  if(later.asElement())await later.asElement().click()
  await page.click('[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{timeout:8000})
  await h.state(page,'round04-empty-panel')
  await h.textButton(page,'更多')
  await h.state(page,'round04-more')
  const input=await page.$('.pm-restore-file')
  assert(input)
  await input.uploadFile(h.runtime+'/backups/current-f5-backup.json')
  await page.waitForSelector('.pm-restore-confirm',{visible:true,timeout:10000})
  const ui=await h.state(page,'round04-prechecked')
  console.log({text:ui.text?.slice(-2500),dialogs:ui.dialogs,buttons:ui.buttons.slice(-20)})
} finally {if(stop)await stop();await browser.disconnect()}
