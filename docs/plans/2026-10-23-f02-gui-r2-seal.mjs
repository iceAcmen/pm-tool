import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2'
const combined=repo+'/reports/all-pending-evidence-20261021/CombinedF02RepairR2'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const read=async rel=>JSON.parse(await fs.readFile(out+'/'+rel))
const save=async(rel,value)=>fs.writeFile(out+'/'+rel,typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'})
const complete=await read('combined-complete-inputs.json')
for(const [rel,info] of Object.entries(complete))for(const base of [pkg,repo+'/packages/dsh-pm-tool']){
  const b=await fs.readFile(base+'/'+rel)
  assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
}
const sources=['src/client/views/records/records-listbox.tsx','src/client/views/records/records-deliverable-form.tsx','src/client/views/records/records-deliverable-pointer-dom.test.tsx','src/client/views/records.css']
for(const rel of sources){
  const dest=out+'/frozen-source/'+rel
  await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
  await fs.writeFile(dest,await fs.readFile(pkg+'/'+rel),{flag:'wx'})
}
for(const name of ['2026-10-23-f02-gui-r2-helpers.mjs','2026-10-23-f02-gui-r2-outer.mjs'])
  await fs.writeFile(out+'/'+name,await fs.readFile(repo+'/docs/plans/'+name),{flag:'wx'})
const phases=['derive','backup','start','transfer','restore','binding','precheck','precheck2','apply','reconcile','reconcile2','prepare','pointer','keyboard']
const commands={}
for(const phase of phases){
  const receipt=await read(phase+'-outer-receipt.json'),start=await read(phase+'-outer-start.json')
  const expected=['restore','precheck','apply','reconcile'].includes(phase)?1:0
  assert.equal(receipt.status,expected,phase)
  commands[phase]={...receipt,actualArgvFromStart:start.argv,parentPidFromStart:start.parentPid,childPid:'not captured',argvBoundary:'spawnSync has no spawnargs; original receipt retained, actual argv captured before execution'}
}
const chains={}
for(const phase of ['r2prepare','r2pointer','r2keyboard']){
  const events=await read(phase+'-events.json')
  const requests=events.rows.filter(r=>r.type==='request')
  const mutations=requests.filter(r=>r.body.payload.args.line.startsWith('/pm deliverable update '))
  assert.equal(mutations.length,1,phase)
  const mutation=mutations[0],response=events.rows.find(r=>r.type==='response'&&r.body.rpcId===mutation.body.rpcId)
  assert(response);assert.equal(response.body.result.value.result.kind,'success')
  assert.equal(events.rows.filter(r=>r.type==='exception').length,0)
  for(const frame of events.frames)assert.equal(sha(await fs.readFile(out+'/'+frame.file)),frame.sha256)
  const native=await read(phase+'-native-click-observations.json')
  assert.equal(native.cleanup.removed,2)
  chains[phase]={mutationRequest:mutation,mutationResponse:response,snapshotRequests:requests.filter(r=>r.body.payload.args.line==='/pm web snapshot').length,otherRequests:requests.filter(r=>!r.body.payload.args.line.startsWith('/pm deliverable update ')&&r.body.payload.args.line!=='/pm web snapshot'),frames:events.frames.length,nativeClickRows:native.clicks.length}
  assert.equal(chains[phase].otherRequests.length,0)
}
const baseline=await read('r2reconcile2-restored-current-f5-roots.json'),final=await read('r2keyboard-final-normal-exit-roots.json')
const changes=Object.keys({...baseline,...final}).filter(k=>JSON.stringify(baseline[k])!==JSON.stringify(final[k]))
assert.deepEqual(changes,['data/pmtool/deliverables/dlv-0001.json'])
for(const rel of Object.keys(baseline).filter(k=>k.startsWith('data/pmtool/')&&k!=='data/pmtool/deliverables/dlv-0001.json'))
  assert.deepEqual(await fs.readFile(out+'/r2reconcile2-restored-current-f5-raw/'+rel),await fs.readFile(out+'/r2keyboard-final-normal-exit-raw/'+rel))
const ui=await read('r2keyboard-final-normal-exit.json')
assert.equal(ui.dialogs.length,0)
const binding=await read('activation-binding.json')
assert.equal(sha(await fs.readFile(pkg+'/lib/client.js')),binding.builtSha256)
const reports={}
for(const rel of ['docs/testing/f02-combined-regression-review-20261023-r2-report.md','docs/testing/f02-combined-regression-review-20261023-r2-seal.json','docs/testing/f02-combined-regression-review-20261023-r2-seal-tool-receipt.json','docs/testing/six-repairs-pointer-gui-review-20261023-r1-report.md','docs/testing/f02-option-native-trace-review-20261023-r2-report.md']){
  const b=await fs.readFile(repo+'/'+rel)
  reports[rel]={bytes:b.length,sha256:sha(b)}
}
const summary={at:new Date().toISOString(),role:'Main execution and evidence collection only',baseline:'9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',candidate:'CombinedF02RepairR2',combinedIndexSha256:sha(await fs.readFile(combined+'/index-r2.json')),binding,commands,chains,initialRestore:await read('r2reconcile2-backup-records.json'),wholeWindowRootChanges:changes,finalUI:{origin:ui.origin,timeOrigin:ui.timeOrigin,viewport:ui.viewport,dialogs:ui.dialogs},sourceInputs:Object.keys(complete).length,sourceInputsPreserved:true,reports,independentGUI:'PENDING',notSigned:['P1004','other six repairs','F01','P3004','full B8','parent commit','release'],historicalFailuresPreserved:['networkidle0 timeout, page already loaded','first PM-open wait, current second observed native entry succeeds','restore result success then stale QA-G A wait timeout','first read-only reconcile assumed naked extra records; corrected storage-key/record tuples'],credentialFilesIncluded:false}
await save('summary.json',summary)
const files={}
const excludes=new Set(['index-r1.json','seal-r1.json','seal-outer-receipt.json'])
async function walk(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name,rel=p.slice(out.length+1)
    if(excludes.has(rel))continue
    if(e.isDirectory())await walk(p)
    else{
      assert(e.isFile(),'No symlinks in this GUI package')
      const b=await fs.readFile(p);files[rel]={bytes:b.length,sha256:sha(b)}
    }
  }
}
await walk(out)
await save('index-r1.json',{at:new Date().toISOString(),files})
const index=await fs.readFile(out+'/index-r1.json')
await save('seal-r1.json',{at:new Date().toISOString(),members:Object.keys(files).length,indexSha256:sha(index),runtime:'/private/tmp/pmtool-f02-repair-gui-runtime-20261023-r2',port:3269,pid:binding.pid,rootChanges:changes,sourceInputs:525,GUIVerdict:'PENDING independent review',excludes:[...excludes],outerReceipt:'Written by the actual outer executor after this script returns; no anticipated exit written'})
console.log({members:Object.keys(files).length,indexSha256:sha(index),rootChanges:changes,GUIPending:true})
