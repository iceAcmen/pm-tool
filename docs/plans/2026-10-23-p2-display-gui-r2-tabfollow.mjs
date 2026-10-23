import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round04-native-tab-follow')
  await h.state(page,'round04-before')
  await page.click('button[aria-label="展开 AI 副驾，保留此前上下文"]')
  await page.click('input[placeholder="问点什么，例如：下周会不会延期？"]')
  async function focus(){
    return page.evaluate(()=>{
      const n=document.activeElement,b=n?.getBoundingClientRect(),s=n?getComputedStyle(n):null
      return {tag:n?.tagName,text:n?.innerText,aria:n?.getAttribute('aria-label'),placeholder:n?.getAttribute('placeholder'),bbox:b?.toJSON(),outline:{color:s?.outlineColor,width:s?.outlineWidth,style:s?.outlineStyle}}
    })
  }
  const route=[{input:'pointer on existing blank question input; no type/send',focus:await focus()}]
  const ordered=await page.evaluate(()=>[...document.querySelectorAll('.pm-sidecar button,.pm-sidecar input,.pm-sidecar textarea')].filter(n=>n.getClientRects().length&&!n.disabled&&n.tabIndex>=0).map(n=>({tag:n.tagName,text:n.innerText,aria:n.getAttribute('aria-label'),placeholder:n.getAttribute('placeholder')})))
  await h.save('round04-natural-order.json',ordered)
  const inputIndex=ordered.findIndex(n=>n.placeholder==='问点什么，例如：下周会不会延期？'),openerIndex=ordered.findIndex(n=>n.text?.trim()==='打开任务')
  assert(inputIndex>=0&&openerIndex>=0)
  const key=inputIndex>openerIndex?'Shift-Tab':'Tab'
  for(let i=0;i<Math.abs(inputIndex-openerIndex)+3;i++){
    if(key==='Shift-Tab'){await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift')}
    else await page.keyboard.press('Tab')
    const f=await focus();route.push({input:key,focus:f})
    if(f.text?.trim()==='打开任务')break
  }
  assert.equal(route.at(-1).focus.text?.trim(),'打开任务')
  await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift')
  const previous=await focus()
  await h.state(page,'round04-natural-previous-visible')
  await page.keyboard.press('Tab')
  const reached=await focus()
  assert.equal(reached.text?.trim(),'打开任务')
  await h.state(page,'round04-natural-tab-opener-visible')
  await h.save('round04-natural-tab-proof.json',{route,previous,input:'native Tab',reached,oldAnswerRestored:false,context:'既有处理卡正常恢复；原ask正文未恢复，是否承接原接缝交独立专家裁'})
  await page.click('button[aria-label="最小化为侧边标签（保留上下文）"]')
  await h.state(page,'round04-after')
  console.log(JSON.stringify({previous,reached,routeInputs:route.map(n=>n.input)}))
}catch(e){await h.save('round04-error.json',{error:String(e),stack:e.stack});await h.state(page,'round04-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
