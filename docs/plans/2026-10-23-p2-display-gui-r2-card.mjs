import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round02-original-card-recovery')
  await h.textButton(page,'AI 副驾')
  const s=await h.state(page,'round02-original-card-observed')
  const card=await page.evaluate(()=>({
    openers:[...document.querySelectorAll('button')].filter(n=>n.innerText.trim()==='打开任务').map(n=>({text:n.innerText,visible:!!n.getClientRects().length})),
    sidecar:[...document.querySelectorAll('[class*="sidecar"]')].filter(n=>n.className.includes('portal')||n.getAttribute('aria-label')).map(n=>({className:n.className,aria:n.getAttribute('aria-label'),hidden:n.hidden,text:n.innerText})),
    buttons:[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length&&n.getAttribute('aria-label')).map(n=>({aria:n.getAttribute('aria-label'),text:n.innerText}))
  }))
  await h.save('round02-original-card-availability.json',card)
  console.log(JSON.stringify({originalOpenerCount:card.openers.length,card}))
  if(!card.openers.length){
    await page.click('button[aria-label="最小化为侧边标签（保留上下文）"]')
    await h.state(page,'round02-no-original-card-minimized')
  }
}catch(e){await h.save('round02-card-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
