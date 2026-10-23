import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round06')
  await page.click('[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{timeout:8000})
  await h.state(page,'round06-empty-panel')
  await h.textButton(page,'更多')
  await h.state(page,'round06-more')
  const input=await page.$('.pm-restore-file')
  assert(input)
  await input.uploadFile(h.runtime+'/backups/current-f5-backup.json')
  await page.waitForSelector('.pm-restore-confirm',{visible:true,timeout:10000})
  const ui=await h.state(page,'round06-prechecked')
  console.log({text:ui.text?.slice(-2300),dialogs:ui.dialogs,buttons:ui.buttons.slice(-18)})
} catch(e) {
  await h.state(page,'round06-error-state');throw e
} finally {if(stop)await stop();await browser.disconnect()}
