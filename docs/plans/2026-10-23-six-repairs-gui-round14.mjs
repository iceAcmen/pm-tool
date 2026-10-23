import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round14')
  await h.state(page,'round14-before-reload')
  await page.reload({waitUntil:'domcontentloaded',timeout:15000})
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
  for(const [label,id] of [['milestone','ref-mvk0iiij-42f7xa'],['deliverable','ref-mvk0n0me-25tmos']]){
    const response=await h.command(page,'/pm reflect '+id,'round14-'+label+'-reopen')
    assert.equal(response.result.value.result.kind,'success')
    await page.waitForFunction((id)=>document.body.innerText.includes('复盘 ID：'+id),{timeout:5000},id)
    await h.state(page,'round14-'+label+'-reopen-ui')
    await h.save('round14-'+label+'-body.json',await page.evaluate(()=>({text:document.body.innerText})))
  }
  await h.command(page,'/pm reflect-list p-0001','round14-list')
  await h.state(page,'round14-list-ui')
  await h.save('round14-list-body.json',await page.evaluate(()=>({text:document.body.innerText})))
  await h.command(page,'/pm web snapshot','round14-snapshot')
  await h.state(page,'round14-final-read')
  console.log({reloadAndBothRead:true,origin:new URL(page.url()).origin})
} catch(e){await h.state(page,'round14-error-state');throw e}
finally {if(stop)await stop();await browser.disconnect()}
