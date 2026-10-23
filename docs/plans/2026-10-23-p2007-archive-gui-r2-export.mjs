import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2007ArchiveRepairGuiR2'),{browser,page}=await h.connect()
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const inputs=JSON.parse(await fs.readFile(repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2/combined-complete-inputs.json'))
  for(const [rel,info] of Object.entries(inputs))for(const base of [pkg,repo+'/packages/dsh-pm-tool']){
    const b=await fs.readFile(base+'/'+rel);assert.equal(b.length,info.bytes);assert.equal(h.sha(b),info.sha256)
  }
  await h.save('round02-inputs-preflight.json',{at:new Date().toISOString(),inputs:Object.keys(inputs).length,mainAndFrozenSame:true})
  assert.equal(await fs.stat(h.runtime+'/exports/p2007-archive-repair-gui-r2').catch(()=>null),null)
  stop=await h.record(page,'round02-archive-review')
  await h.state(page,'round02-before-archive')
  const archive=await h.command(page,'/pm archive p-0001 p2007-archive-repair-gui-r2','round02-archive')
  assert.equal(archive.result.value.result.kind,'success')
  assert(archive.result.value.result.text.includes(h.runtime+'/exports/p2007-archive-repair-gui-r2'))
  await h.state(page,'round02-after-archive')
  const review=await h.command(page,'/pm review p-0001 2026-10-16 2026-10-23','round02-review')
  assert.equal(review.result.value.result.kind,'success')
  await h.state(page,'round02-after-review')
  console.log(JSON.stringify({archive,review}))
}catch(e){await h.save('round02-error.json',{error:String(e),stack:e.stack});await h.state(page,'round02-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}
