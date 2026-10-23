import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/P2007ArchiveRepairGuiR2'
const binding=repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const runtime='/private/tmp/pmtool-f02-repair-gui-runtime-20261023-r2'
const sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>JSON.parse(await fs.readFile(out+'/'+p))
const save=async(p,v)=>fs.writeFile(out+'/'+p,typeof v==='string'?v:JSON.stringify(v,null,2),{flag:'wx'})
const inputs=JSON.parse(await fs.readFile(binding+'/combined-complete-inputs.json'))
for(const [rel,info] of Object.entries(inputs))for(const base of [pkg,repo+'/packages/dsh-pm-tool']){
  const b=await fs.readFile(base+'/'+rel);assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
}
for(const name of ['activation-binding.json','combined-candidate.json','combined-source-files.json','combined-complete-inputs.json','combined-built-artifacts.json'])
  await fs.writeFile(out+'/'+name,await fs.readFile(binding+'/'+name),{flag:'wx'})
for(const rel of ['src/core/archive.ts','src/core/archive.test.ts','src/commands/archive.ts','src/core/review-materials.ts','src/commands/review.ts','src/core/storage.ts']){
  const dest=out+'/frozen-source/'+rel
  await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
  await fs.writeFile(dest,await fs.readFile(pkg+'/'+rel),{flag:'wx'})
}
for(const rel of ['docs/plans/2026-10-23-p2007-archive-gui-r2-plan.md','docs/plans/2026-10-23-p2007-archive-gui-r2-outer.mjs'])
  await fs.writeFile(out+'/'+rel.split('/').at(-1),await fs.readFile(repo+'/'+rel),{flag:'wx'})
await fs.writeFile(out+'/harness-source.mjs',await fs.readFile('/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'),{flag:'wx'})
const names=await fs.readdir(out),rootNames=names.filter(n=>n.endsWith('-roots.json'))
const before=await read('round00-before-entry-roots.json')
const rootChecks=[]
for(const name of rootNames){
  const current=await read(name);assert.deepEqual(current,before)
  const tag=name.slice(0,-'-roots.json'.length)
  let rawCount=0
  for(const rel of Object.keys(before).filter(k=>k.startsWith('data/pmtool/'))){
    const b=await fs.readFile(out+'/'+tag+'-raw/'+rel)
    assert.equal(b.length,before[rel].bytes);assert.equal(sha(b),before[rel].sha256);rawCount++
  }
  rootChecks.push({name,roots:Object.keys(current).length,rawCount,changes:[]})
}
const commands={},events={}
for(const phase of ['inspect','entry','export','files','filesfollow','reentry','reentryfollow']){
  const r=await read(phase+'-outer-receipt.json')
  assert.equal(r.status,['files','reentry'].includes(phase)?1:0)
  commands[phase]=r
}
let frameCount=0
const requests=[],responses=[]
for(const name of names.filter(n=>n.endsWith('-events.json'))){
  const event=await read(name)
  for(const frame of event.frames)assert.equal(sha(await fs.readFile(out+'/'+frame.file)),frame.sha256)
  assert.equal(event.rows.filter(r=>r.type==='exception').length,0)
  frameCount+=event.frames.length
  requests.push(...event.rows.filter(r=>r.type==='request'))
  responses.push(...event.rows.filter(r=>r.type==='response'))
  events[name]={frames:event.frames.length,rows:event.rows}
}
for(const request of requests){
  const response=responses.find(r=>r.body.rpcId===request.body.rpcId)
  assert(response);assert.equal(response.body.result.value.result.kind,'success')
}
const lines=requests.map(r=>r.body.payload.args.line)
assert.equal(lines.filter(l=>l==='/pm archive p-0001 p2007-archive-repair-gui-r2').length,1)
assert.equal(lines.filter(l=>l==='/pm review p-0001 2026-10-16 2026-10-23').length,2)
assert(lines.every(l=>l.startsWith('/pm archive ')||l.startsWith('/pm review ')||l==='/pm web snapshot'))
const snapshot=JSON.parse(await fs.readFile(out+'/exported-originals/package.json'))
const archive=await read('round02-archive-command.json')
const review=await read('round02-review-command.json')
const reviewText=review.body.result.value.result.text
const material=JSON.parse(reviewText.match(/```json\n([\s\S]*?)\n```/)[1])
assert.equal(material.counts.reflectionKnownLines,9)
assert.equal(material.counts.doneTasks,1);assert.equal(material.counts.wrappedTasks,1)
const rows=await read('round03-source-archive-byte-observations.json')
for(const row of rows.rows){
  const m=material.reflections.find(r=>r.id===row.id);assert(m);assert.deepEqual(m.knownLines,row.known)
  assert.equal(m.sourceEvent,row.sourceEvent)
}
assert.equal(snapshot.tasks.find(t=>t.id==='t-0007').status,'done')
assert.equal(snapshot.tasks.find(t=>t.id==='t-0008').status,'wrapped')
for(const row of await read('round03-export-originals.json')){
  const b=await fs.readFile(row.originalPath)
  assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256)
  assert.deepEqual(b,await fs.readFile(out+'/exported-originals/'+row.name))
}
assert.deepEqual((await fs.readdir(runtime+'/exports/p2007-archive-repair-gui-r2')).sort(),['README-字段说明.md','package.json'].sort())
const refs={}
for(const rel of ['docs/testing/p2007-archive-known-gaps-red-20261023-r1.md','docs/testing/p2007-archive-projection-source-auto-20261023-r1-report.md','docs/testing/f02-combined-regression-review-20261023-r2-report.md','docs/testing/f02-combined-regression-review-20261023-r2-seal-tool-receipt.json']){
  const b=await fs.readFile(repo+'/'+rel);refs[rel]={bytes:b.length,sha256:sha(b)}
}
await save('summary.json',{at:new Date().toISOString(),role:'Main raw GUI execution, independent verdict pending',candidate:'CombinedF02RepairR2',inputs:525,mainAndFrozenInputsPreserved:true,rootChecks,commands,events,frameCount,requestLines:lines,archiveRPC:archive.body.rpcId,reviewRPC:review.body.rpcId,knownCount:9,gapCount:2,rows:rows.rows,material,wholeWindowBusinessChanges:[],roots:Object.keys(before).length,raw:Object.keys(before).filter(k=>k.startsWith('data/pmtool/')).length,originals:await read('round03-export-originals.json'),reentry:await read('round06-reentry-observations.json'),facilityFailures:['files outer1: Puppeteer unknown compound Control+End after original package body read/upper PNG; original preserved, existing filetab native wheel/PageUp and README follow collected','reentry outer1: actual reload succeeded; new-conversation ephemeral output absent; wait timed out, original retained, same loaded page read-only review reread and original file reopened without archive replay'],refs,GUIPending:true,notSigned:['period boundary entirety','P2007 entirety','P1004 native Tab arrival','parent ordinarycommit','push/release']})
const members={},excluded=new Set(['index-r1.json','seal-r1.json','seal-outer-receipt.json'])
async function walk(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name,rel=p.slice(out.length+1)
    if(excluded.has(rel))continue
    if(e.isDirectory())await walk(p)
    else{assert(e.isFile());const b=await fs.readFile(p);members[rel]={bytes:b.length,sha256:sha(b)}}
  }
}
await walk(out)
await save('index-r1.json',{at:new Date().toISOString(),files:members})
const index=await fs.readFile(out+'/index-r1.json')
await save('seal-r1.json',{at:new Date().toISOString(),members:Object.keys(members).length,indexSha256:sha(index),frameCount,rootChanges:[],knownCount:9,gapCount:2,GUIVerdict:'PENDING independent review',excludes:[...excluded],outerReceipt:'Actual outer writes receipt after this process returns'})
console.log({members:Object.keys(members).length,indexSha256:sha(index),frameCount,rootStates:rootChecks.length,businessChanges:[],knownCount:9,gapCount:2,GUIPending:true})
