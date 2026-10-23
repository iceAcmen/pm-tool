import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const repo='/Users/bytedance/Projects/dsh-pm/pm-tool',complete=JSON.parse(await fs.readFile(repo+'/reports/all-pending-evidence-20261021/CombinedF02RepairR2/complete-inputs.json','utf8'))
  const checks=[]
  for(const [rel,meta]of Object.entries(complete)){
    for(const root of [repo+'/packages/dsh-pm-tool','/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool']){
      const b=await fs.readFile(root+'/'+rel)
      assert.equal(b.length,meta.bytes);assert.equal(h.sha(b),meta.sha256)
    }
    checks.push({file:rel,...meta})
  }
  await h.save('complete-inputs-binding.json',{count:checks.length,checks})
  stop=await h.record(page,'round01-pm-entry')
  await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{visible:true,timeout:10000})
  const s=await h.state(page,'round01-pm-restored')
  const extra=await page.evaluate(()=>({
    links:[...document.querySelectorAll('a')].filter(n=>n.getClientRects().length).map(n=>({text:n.innerText,href:n.getAttribute('href')})),
    controls:[...document.querySelectorAll('.pm-shell button,.pm-shell select')].filter(n=>n.getClientRects().length).map(n=>({tag:n.tagName,text:n.innerText,aria:n.getAttribute('aria-label'),title:n.title,value:n.value,options:n.tagName==='SELECT'?[...n.options].map(o=>({text:o.text,value:o.value})):undefined})),
    sidecar:[...document.querySelectorAll('[class*="sidecar-portal"]')].map(n=>({className:n.className,hidden:n.hidden,text:n.innerText})),
    openers:[...document.querySelectorAll('button')].filter(n=>n.innerText.trim()==='打开任务').map(n=>({text:n.innerText,visible:!!n.getClientRects().length}))
  }))
  await h.save('round01-pm-controls.json',extra)
  console.log(JSON.stringify({count:checks.length,text:s.text,extra}))
}catch(e){await h.save('round01-entry-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
