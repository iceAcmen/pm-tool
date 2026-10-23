import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-gui-capture-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3264')
  stop=await h.record(page,'round02')
  if(!await page.$('[contenteditable=true]')){
    const button=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim().startsWith('新会话')))
    assert(button.asElement())
    await button.asElement().click()
    await page.waitForSelector('[contenteditable=true]',{timeout:15000})
  }
  const body=await h.command(page,'/pm backup','round02-backup')
  await h.state(page,'round02-old-f5-after-backup')
  console.log({body})
} finally {if(stop)await stop();await browser.disconnect()}
