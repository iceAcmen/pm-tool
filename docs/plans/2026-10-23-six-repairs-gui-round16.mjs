import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try{
  stop=await h.record(page,'round16')
  await page.focus('button[aria-label="交付物状态"]')
  await page.click('button[aria-label="交付物状态"]')
  await page.waitForSelector('[role=option]',{visible:true,timeout:4000})
  const ui=await h.state(page,'round16-pointer-menu')
  const menu=await page.evaluate(()=>[...document.querySelectorAll('[role=option]')].map(n=>({text:n.innerText,role:n.getAttribute('role'),cls:n.className,bbox:n.getBoundingClientRect().toJSON()})))
  await h.save('round16-options.json',menu)
  console.log({dialogs:ui.dialogs,menu})
}catch(e){await h.state(page,'round16-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
