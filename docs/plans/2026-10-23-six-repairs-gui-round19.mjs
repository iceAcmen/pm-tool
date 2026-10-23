import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try{
  stop=await h.record(page,'round19')
  await h.state(page,'round19-before-accepted-selection')
  const option=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.trim()==='已验收'))
  assert(option.asElement());await option.asElement().click()
  await h.state(page,'round19-after-accepted-selection')
  const save=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='保存更改'))
  assert(save.asElement())
  await save.asElement().scrollIntoView()
  await h.save('round19-save-pointer-target.json',await save.asElement().evaluate(n=>{
    const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
    return {text:n.innerText,bbox:b.toJSON(),hit:{tag:hit?.tagName,cls:hit?.className,text:hit?.innerText},hitIsButton:hit===n||n.contains(hit),popup:!!document.querySelector('.rb-lb-menu')}
  }))
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('deliverable update dlv-0001'),{timeout:6000})
  await save.asElement().click()
  const res=await waiting
  await h.save('round19-main-save-response.json',{status:res.status(),body:await res.json()})
  await h.state(page,'round19-main-save-response-ui')
}catch(e){await h.save('round19-error.json',{error:String(e),stack:e.stack});await h.state(page,'round19-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
