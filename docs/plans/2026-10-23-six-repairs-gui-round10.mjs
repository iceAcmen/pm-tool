import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round10')
  await h.state(page,'round10-before-l2-views')
  for(const [label,id,event,sourceId] of [['milestone','ref-mvk0iiij-42f7xa','milestone-achieved','m-0001'],['deliverable','ref-mvk0n0me-25tmos','deliverable-accepted','dlv-0001']]){
    const response=await h.command(page,'/pm reflect '+id,'round10-'+label+'-view')
    assert.equal(response.result.value.result.kind,'success')
    await page.waitForFunction((id)=>document.body.innerText.includes('复盘 ID：'+id),{timeout:5000},id)
    await h.state(page,'round10-'+label+'-view-ui')
    const ui=await page.evaluate(()=>({text:document.body.innerText,visible:[...document.querySelectorAll('div,p,pre')].filter(n=>n.childElementCount===0&&n.innerText.includes('复盘 ID：')).map(n=>({tag:n.tagName,cls:n.className,text:n.innerText,bbox:n.getBoundingClientRect().toJSON()}))}))
    await h.save('round10-'+label+'-view-body.json',ui)
    assert(ui.text.includes(event));assert(ui.text.includes(sourceId))
    console.log({label,id,sourceId,bodyChars:ui.text.length,visible:ui.visible.map(n=>({tag:n.tag,cls:n.cls,bbox:n.bbox}))})
  }
} catch(e){await h.state(page,'round10-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
