import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2'
const binding=repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>JSON.parse(await fs.readFile(out+'/'+p))
const save=async(p,v)=>fs.writeFile(out+'/'+p,typeof v==='string'?v:JSON.stringify(v,null,2),{flag:'wx'})
const inputs=JSON.parse(await fs.readFile(binding+'/combined-complete-inputs.json'))
for(const [rel,meta]of Object.entries(inputs))for(const base of [pkg,repo+'/packages/dsh-pm-tool']){
  const b=await fs.readFile(base+'/'+rel);assert.equal(b.length,meta.bytes);assert.equal(sha(b),meta.sha256)
}
for(const name of ['activation-binding.json','combined-candidate.json','combined-source-files.json','combined-complete-inputs.json','combined-built-artifacts.json'])
  await fs.writeFile(out+'/'+name,await fs.readFile(binding+'/'+name),{flag:'wx'})
for(const rel of ['src/index.ts','src/client/panel.tsx','src/client/views/tasks.tsx','src/client/views/tasks.css','src/client/views/okrs.tsx','src/client/views/okr-model.ts']){
  const dest=out+'/frozen-source/'+rel
  await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
  await fs.writeFile(dest,await fs.readFile(pkg+'/'+rel),{flag:'wx'})
}
for(const rel of ['docs/plans/2026-10-23-p2-display-gui-r2-plan.md','docs/plans/2026-10-23-p2-display-gui-r2-outer.mjs'])
  await fs.writeFile(out+'/'+rel.split('/').at(-1),await fs.readFile(repo+'/'+rel),{flag:'wx'})
await fs.writeFile(out+'/harness-source.mjs',await fs.readFile('/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'),{flag:'wx'})
const names=await fs.readdir(out),before=await read('round00-initial-roots.json'),rootChecks=[]
for(const name of names.filter(n=>n.endsWith('-roots.json'))){
  const roots=await read(name);assert.deepEqual(roots,before)
  const tag=name.slice(0,-'-roots.json'.length);let rawCount=0
  for(const rel of Object.keys(before).filter(k=>k.startsWith('data/pmtool/'))){
    const b=await fs.readFile(out+'/'+tag+'-raw/'+rel)
    assert.equal(b.length,before[rel].bytes);assert.equal(sha(b),before[rel].sha256);rawCount++
  }
  rootChecks.push({name,roots:Object.keys(roots).length,rawCount,changes:[]})
}
const commands={}
for(const phase of ['inspect','entry','card','tab','tabfollow','tasks','group','projectmenu','projects','okr','reload']){
  const r=await read(phase+'-outer-receipt.json');assert.equal(r.status,0);commands[phase]=r
}
const eventSummary={},requests=[],responses=[];let frameCount=0
for(const name of names.filter(n=>n.endsWith('-events.json'))){
  const e=await read(name)
  for(const f of e.frames)assert.equal(sha(await fs.readFile(out+'/'+f.file)),f.sha256)
  assert.equal(e.rows.filter(r=>r.type==='exception'||r.type==='unavailable-response').length,0)
  frameCount+=e.frames.length
  requests.push(...e.rows.filter(r=>r.type==='request'));responses.push(...e.rows.filter(r=>r.type==='response'))
  eventSummary[name]={frames:e.frames.length,rows:e.rows}
}
for(const q of requests){
  const r=responses.find(r=>r.body.rpcId===q.body.rpcId)
  assert(r);assert.equal(r.body.result.value.result.kind,'success')
  assert(!/\/pm (ask|task update|okr update|export|archive)/.test(q.body.payload.args.line))
}
const first=responses.find(r=>r.body.result.value.result.text.startsWith('{"projects":'))
assert(first)
const snapshot=JSON.parse(first.body.result.value.result.text)
assert.deepEqual(snapshot.latestExports['p-0001'],{at:'2026-10-22T21:23:08.315Z',format:'plain'})
assert.equal(snapshot.latestExports['p-0002'],null)
assert(snapshot.tasks.filter(t=>t.projectId==='p-0001').every(t=>t.parentId===null))
const proof=await read('round04-natural-tab-proof.json')
assert.notEqual(proof.previous.text,'打开任务');assert.equal(proof.input,'native Tab');assert.equal(proof.reached.text,'打开任务')
const refs={}
for(const rel of ['docs/testing/p2002-outbound-slot-source-auto-20261023-r2-report.md','docs/testing/p2004-kr-related-source-auto-20261023-r2-report.md','docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-report.md','docs/testing/p1004-repair-gui-review-20261023-r2-report.md','docs/testing/f02-combined-regression-review-20261023-r2-report.md']){
  const b=await fs.readFile(repo+'/'+rel);refs[rel]={bytes:b.length,sha256:sha(b)}
}
await save('summary.json',{at:new Date().toISOString(),role:'Main GUI raw execution, NOT independent PASS',candidate:'CombinedF02RepairR2',inputs:525,completeInputsPreserved:true,roots:Object.keys(before).length,rawPerState:Object.keys(before).filter(n=>n.startsWith('data/pmtool/')).length,rootChecks,commands,eventSummary,frameCount,requestLines:requests.map(q=>q.body.payload.args.line),snapshot,wholeWindowBusinessChanges:[],nativeTab:proof,refs,GUIPending:true,exactEvidenceLimits:['原P1004 ask正文跨reload未恢复；当前既有处理卡Tab到同opener是真实动作，是否承接原上下文须独立裁','当前A7任务全parentId null，无真实子层/可折叠父；不以状态分组leaf冒树子层，原该边界未采','原native tab首段18键从页面前部未达，原未达证保，后续现有input逆序到opener再自然前一刷新→nativeTab实到'],notSigned:['whole P2002','whole P2004','whole B8','parent ordinarycommit','push/release']})
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
await save('seal-r1.json',{at:new Date().toISOString(),members:Object.keys(members).length,indexSha256:sha(index),frameCount,rootStates:rootChecks.length,rootChanges:[],GUIVerdict:'PENDING independent review',excludes:[...excluded],outerReceipt:'actual outer writes receipt after process returns'})
console.log({members:Object.keys(members).length,indexSha256:sha(index),frameCount,rootStates:rootChecks.length,businessChanges:[],GUIPending:true})
