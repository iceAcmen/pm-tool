import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2007ArchiveRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round01-entry')
  await page.click('button[aria-label="最小化为侧边标签（保留上下文）"]')
  const entry=await page.evaluateHandle(()=>[...document.querySelectorAll('button[aria-label="新建会话"]')].find(n=>n.getClientRects().length&&n.innerText.includes('DSH')))
  assert(entry.asElement())
  await entry.asElement().click()
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
  await h.state(page,'round01-composer-ready')
  console.log(JSON.stringify(await page.evaluate(()=>({
    pathname:location.pathname,editables:[...document.querySelectorAll('[contenteditable=true]')].map(n=>({visible:!!n.getClientRects().length,text:n.innerText})),
    buttons:[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length).map(n=>({text:n.innerText,aria:n.getAttribute('aria-label')})),
  }))))
}catch(e){await h.save('round01-entry-error.json',{error:String(e),stack:e.stack});await h.state(page,'round01-entry-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
