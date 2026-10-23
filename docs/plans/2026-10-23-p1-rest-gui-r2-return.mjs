import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-p1-history-harness-20261023-r1.mjs'
const h=createHarness('P1RestVisibleR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3267')
  stop=await h.record(page,'round04-return')
  await h.state(page,'round04-history-final')
  await page.goto(await fs.readFile(h.runtime+'/private/rest-r2-return-url','utf8'),{waitUntil:'domcontentloaded',timeout:15000})
  await page.waitForSelector('button[aria-label="项目管理"]',{visible:true,timeout:10000})
  if(!await page.$('.pm-shell'))await page.click('button[aria-label="项目管理"]')
  await page.waitForSelector('.pm-shell',{visible:true,timeout:10000})
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  await h.state(page,'round04-returned-new-candidate')
  const current={}
  const runtime='/private/tmp/pmtool-f02-repair-gui-runtime-20261023-r2'
  async function walk(dir){
    for(const e of await fs.readdir(dir,{withFileTypes:true})){
      const p=dir+'/'+e.name
      if(e.isDirectory())await walk(p)
      else{const b=await fs.readFile(p);current[p.slice(runtime.length+1)]={bytes:b.length,sha256:h.sha(b)}}
    }
  }
  for(const name of ['data/pmtool','files','backups'])await walk(runtime+'/'+name)
  const baseline=JSON.parse(await fs.readFile('/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/round10-final-a-roots.json','utf8'))
  assert.deepEqual(current,baseline)
  await h.save('round04-new-candidate-protected.json',{baseline:'P2DisplayRepairGuiR2/round10-final-a-roots.json',current,changes:[]})
  console.log(JSON.stringify({origin:new URL(page.url()).origin,protectedNewRoots:Object.keys(current).length,changes:[]}))
}catch(e){await h.save('round04-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}
