import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/P1004RepairGuiR2'
const bindingRoot=repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const read=async rel=>JSON.parse(await fs.readFile(out+'/'+rel))
const save=async(rel,value)=>fs.writeFile(out+'/'+rel,typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'})
const inputBytes=await fs.readFile(bindingRoot+'/combined-complete-inputs.json'),inputs=JSON.parse(inputBytes)
for(const [rel,info] of Object.entries(inputs))for(const base of [pkg,repo+'/packages/dsh-pm-tool']){
  const b=await fs.readFile(base+'/'+rel)
  assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
}
for(const name of ['activation-binding.json','combined-candidate.json','combined-source-files.json','combined-complete-inputs.json','combined-built-artifacts.json'])
  await fs.writeFile(out+'/'+name,await fs.readFile(bindingRoot+'/'+name),{flag:'wx'})
for(const rel of ['src/client/panel.tsx','src/client/panel.css','src/client/shared/drawers/sidecar-portal.tsx','src/client/panel-sidecar-task-handoff.test.tsx']){
  const dest=out+'/frozen-source/'+rel
  await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
  await fs.writeFile(dest,await fs.readFile(pkg+'/'+rel),{flag:'wx'})
}
for(const rel of ['docs/plans/2026-10-23-p1004-gui-r2-exit-helper.mjs','docs/plans/2026-10-23-p1004-gui-r2-outer.mjs','docs/plans/2026-10-23-f02-gui-r2-helpers.mjs'])
  await fs.writeFile(out+'/'+rel.split('/').at(-1),await fs.readFile(repo+'/'+rel),{flag:'wx'})
await fs.writeFile(out+'/harness-source.mjs',await fs.readFile('/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'),{flag:'wx'})
const commands={},events={}
const phaseMap={prepare:'p1004prepare',ask:'p1004ask',update:'p1004update',cancel:'p1004exit-cancel',x:'p1004exit-x',keys:'p1004exit-keys'}
let frameCount=0
for(const [phase,tag] of Object.entries(phaseMap)){
  const receipt=await read(phase+'-outer-receipt.json')
  assert.equal(receipt.status,phase==='prepare'?1:0,phase)
  commands[phase]=receipt
  const event=await read(tag+'-events.json')
  const requests=event.rows.filter(r=>r.type==='request'),responses=event.rows.filter(r=>r.type==='response')
  for(const request of requests){
    const response=responses.find(r=>r.body.rpcId===request.body.rpcId)
    assert(response,request.body.rpcId)
    assert.equal(response.body.result.value.result.kind,'success')
  }
  assert.equal(event.rows.filter(r=>r.type==='exception').length,0)
  for(const frame of event.frames)assert.equal(sha(await fs.readFile(out+'/'+frame.file)),frame.sha256)
  frameCount+=event.frames.length
  const mutations=requests.filter(r=>r.body.payload.args.line.startsWith('/pm task update '))
  const asks=requests.filter(r=>r.body.payload.args.line.startsWith('/pm ask '))
  assert.equal(mutations.length,['prepare','update'].includes(phase)?1:0)
  assert.equal(asks.length,phase==='ask'?1:0)
  if(['cancel','x','keys'].includes(phase))assert.equal(requests.length,0)
  events[phase]={tag,frames:event.frames.length,requests,responses,mutations:mutations.length,asks:asks.length}
}
const before=await read('p1004prepare-original-current-roots.json'),after=await read('p1004exit-keys-visible-return-focus-roots.json')
const changes=Object.keys({...before,...after}).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]))
assert.deepEqual(changes,['data/pmtool/tasks/t-0006.json'])
for(const rel of Object.keys(before).filter(k=>k.startsWith('data/pmtool/')&&k!=='data/pmtool/tasks/t-0006.json'))
  assert.deepEqual(await fs.readFile(out+'/p1004prepare-original-current-raw/'+rel),await fs.readFile(out+'/p1004exit-keys-visible-return-focus-raw/'+rel))
const oldRecord=JSON.parse(await fs.readFile(out+'/p1004prepare-original-current-raw/data/pmtool/tasks/t-0006.json')).record
const newRecord=JSON.parse(await fs.readFile(out+'/p1004exit-keys-visible-return-focus-raw/data/pmtool/tasks/t-0006.json')).record
const taskFieldsChanged=Object.keys({...oldRecord,...newRecord}).filter(k=>JSON.stringify(oldRecord[k])!==JSON.stringify(newRecord[k]))
assert.deepEqual(taskFieldsChanged,['updatedAt'])
const exits={}
for(const method of ['cancel','x','keys']){
  const observation=await read('p1004exit-'+method+'-observations.json')
  assert(observation.rootsEqual);assert.equal(observation.uniqueDirectExitAttempts,1)
  assert(observation.returnFocus.centerHitsFocus);assert.equal(observation.returnFocus.text,'打开任务')
  exits[method]=observation
}
const gateway=await read('gateway-restored-after-original-ask.json')
assert(gateway.same)
assert.equal(sha(await fs.readFile(out+'/gateway-before.json')),gateway.sha256)
const liveBinding=await read('activation-binding.json')
assert.equal(sha(await fs.readFile(pkg+'/lib/client.js')),liveBinding.builtSha256)
const refs={}
for(const rel of ['docs/testing/p1-projection-refresh-gui-review-20261023-r1.md','docs/testing/p1004-handoff-source-auto-20261023-r1-report.md','docs/testing/f02-combined-regression-review-20261023-r2-report.md','docs/testing/f02-combined-regression-review-20261023-r2-seal-tool-receipt.json']){
  const b=await fs.readFile(repo+'/'+rel);refs[rel]={bytes:b.length,sha256:sha(b)}
}
await save('summary.json',{at:new Date().toISOString(),role:'Main actual GUI execution and raw collection, no independent verdict',candidate:'CombinedF02RepairR2',sourceInputs:525,sourceInputsPreserved:true,activation:liveBinding,commands,events,frameCount,scope:'Original P1004 §6 old ask→normal human update→refresh→first correct TaskForm→direct cancel/X/native Tab-Enter-ESC→return focus',wholeWindowRootChanges:changes,finalTaskFieldsChanged:taskFieldsChanged,nonTargetRawPreserved:37,askGatewayRequests:1,gatewayRestored:true,exits,refs,prepareFailure:'Actual normal save success; post-save reader expected null, production saves empty string; original outer1 preserved, no save replay',independentGUI:'PENDING',notSigned:['F02','other six repairs','F01','P3004','full B8','parent ordinarycommit','release']})
const files={},excluded=new Set(['index-r1.json','seal-r1.json','seal-outer-receipt.json'])
async function walk(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name,rel=p.slice(out.length+1)
    if(excluded.has(rel))continue
    if(e.isDirectory())await walk(p)
    else{assert(e.isFile());const b=await fs.readFile(p);files[rel]={bytes:b.length,sha256:sha(b)}}
  }
}
await walk(out)
await save('index-r1.json',{at:new Date().toISOString(),files})
const index=await fs.readFile(out+'/index-r1.json')
await save('seal-r1.json',{at:new Date().toISOString(),members:Object.keys(files).length,indexSha256:sha(index),frameCount,rootChanges:changes,taskFieldsChanged,GUIVerdict:'PENDING independent review',excludes:[...excluded],outerReceipt:'Written by actual outer executor after return; not anticipated'})
console.log({members:Object.keys(files).length,indexSha256:sha(index),frameCount,rootChanges:changes,taskFieldsChanged,GUIPending:true})
