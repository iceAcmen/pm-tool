import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
const tag='[DEBUG-f02-option-r2]'
const clicks=[]
const cdp=await page.createCDPSession()
let stop,observer
cdp.on('Runtime.consoleAPICalled',e=>{
  if(e.args[0]?.value===tag)clicks.push({timestamp:e.timestamp,observation:JSON.parse(e.args[1].value)})
})
async function cleanup() {
  if(!observer)return
  const r=await cdp.send('Runtime.callFunctionOn',{
    objectId:observer,
    functionDeclaration:'function(){document.removeEventListener("click",this.capture,true);document.removeEventListener("click",this.bubble,false);return {removed:2}}',
    returnByValue:true,
  })
  await h.save('round28-passive-observer-cleanup.json',r.result.value)
  await cdp.send('Runtime.releaseObject',{objectId:observer})
  observer=undefined
}
try {
  stop=await h.record(page,'round28')
  await h.state(page,'round28-before-passive-observation')
  await cdp.send('Runtime.enable')
  const installed=await cdp.send('Runtime.evaluate',{
    expression:`(() => {
      const identify=n=>n instanceof Element?{tag:n.tagName,id:n.id,cls:n.className,role:n.getAttribute('role'),text:n.textContent?.trim().slice(0,80)}:{tag:String(n)};
      const observe=phase=>e=>console.debug('${tag}',JSON.stringify({
        phase,type:e.type,isTrusted:e.isTrusted,detail:e.detail,defaultPrevented:e.defaultPrevented,
        target:identify(e.target),path:e.composedPath().map(identify),
        focus:identify(document.activeElement),
        status:document.querySelector('#deliverable-status')?.innerText,
        expanded:document.querySelector('#deliverable-status')?.getAttribute('aria-expanded'),
        popup:!!document.querySelector('.rb-lb-menu'),backdrop:!!document.querySelector('.rb-lb-backdrop'),
      }));
      const capture=observe('capture'),bubble=observe('bubble');
      document.addEventListener('click',capture,{capture:true,passive:true});
      document.addEventListener('click',bubble,{capture:false,passive:true});
      return {capture,bubble};
    })()`,
    returnByValue:false,
  })
  assert(!installed.exceptionDetails)
  observer=installed.result.objectId
  assert(observer)
  await page.click('button[aria-label="交付物状态"]')
  await page.waitForSelector('[role=option]',{visible:true,timeout:5000})
  await h.state(page,'round28-status-menu-before-selection')
  const span=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.trim()==='计划中')?.querySelector('span'))
  assert(span.asElement())
  await h.save('round28-planned-pointer-target.json',await span.asElement().evaluate(n=>{
    const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
    return {bbox:b.toJSON(),hit:{tag:hit?.tagName,cls:hit?.className,text:hit?.innerText},hitIsTarget:hit===n||n.contains(hit)}
  }))
  await span.asElement().click()
  await h.state(page,'round28-after-planned-pointer-selection')
  let closeObservation
  try {
    await page.waitForFunction(()=>!document.querySelector('.rb-lb-menu'),{timeout:4000})
    closeObservation={closed:true}
  } catch(e) {closeObservation={closed:false,waitError:String(e)}}
  await h.save('round28-popup-closure-observation.json',closeObservation)
  await h.state(page,'round28-stable-selection-end')
  await cleanup()
  const countBefore=clicks.length
  if(await page.$('.rb-lb-backdrop'))await page.click('.rb-lb-backdrop')
  const cancel=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='取消'))
  assert(cancel.asElement());await cancel.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('[role=dialog]'),{timeout:5000})
  await h.state(page,'round28-after-normal-cancel')
  await h.save('round28-observer-removal-after-clicks.json',{countBefore,countAfter:clicks.length,unchanged:countBefore===clicks.length})
  console.log(JSON.stringify({closeObservation,clicks}))
} catch(e) {
  await h.save('round28-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round28-error-state')
  throw e
} finally {
  await cleanup()
  await h.save('round28-native-click-observations.json',{tag,boundary:'Browser-only passive document listeners; no preventDefault/stopPropagation/DOM/props/store mutation. Native pointer inputs only. No GUI verdict by Main.',clicks})
  await cdp.detach()
  if(stop)await stop()
  await browser.disconnect()
}
