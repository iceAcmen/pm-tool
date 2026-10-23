import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const source=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const out=repo+'/reports/all-pending-evidence-20261021/SixRepairsL2GuiR1'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
assert(!await fs.stat(out).catch(()=>null))
await fs.mkdir(out)
const files={}
async function copy(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name,rel=p.slice(source.length+1)
    if(e.isDirectory()){await fs.mkdir(out+'/'+rel,{recursive:true});await copy(p)}
    else {const b=await fs.readFile(p);await fs.writeFile(out+'/'+rel,b,{flag:'wx'});files[rel]={bytes:b.length,sha256:sha(b)}}
  }
}
await copy(source)
async function save(name,value){
  const b=Buffer.from(JSON.stringify(value,null,2));await fs.writeFile(out+'/'+name,b,{flag:'wx'});files[name]={bytes:b.length,sha256:sha(b)}
}
const states=['round10-before-l2-views','round10-milestone-view-ui','round10-deliverable-view-ui','round11-milestone-before','round11-error-state','round12-after-short-first-submit','round12-three-lines-entered','round12-milestone-edit-ui','round12-milestone-final-ui','round12-milestone-repeat-ui','round13-deliverable-before','round13-three-lines-entered','round13-deliverable-edit-ui','round13-deliverable-final-ui','round13-deliverable-repeat-ui','round14-before-reload','round14-milestone-reopen-ui','round14-deliverable-reopen-ui','round14-list-ui','round14-final-read']
const deltas=[]
for(let i=1;i<states.length;i++){
  const before=JSON.parse(await fs.readFile(out+'/'+states[i-1]+'-roots.json'))
  const after=JSON.parse(await fs.readFile(out+'/'+states[i]+'-roots.json'))
  const paths=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]))
  deltas.push({before:states[i-1],after:states[i],paths})
}
await save('raw-root-transitions.json',deltas)
const initial=JSON.parse(await fs.readFile(out+'/'+states[0]+'-roots.json'))
const final=JSON.parse(await fs.readFile(out+'/'+states.at(-1)+'-roots.json'))
const delta=[...new Set([...Object.keys(initial),...Object.keys(final)])].filter(k=>JSON.stringify(initial[k])!==JSON.stringify(final[k])).sort()
assert.deepEqual(delta,['data/pmtool/reflections/ref-mvk0iiij-42f7xa.json','data/pmtool/reflections/ref-mvk0n0me-25tmos.json'])
const old='/private/tmp/pmtool-successor114-gui-runtime-20261022-r1'
const oldNow={}
async function scan(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name
    if(e.isDirectory())await scan(p)
    else {const b=await fs.readFile(p);oldNow[p.slice(old.length+1)]={bytes:b.length,sha256:sha(b)}}
  }
}
for(const root of ['data/pmtool','files','backups'])await scan(old+'/'+root)
const oldBefore=JSON.parse(await fs.readFile(out+'/round02-old-f5-after-backup-roots.json'))
assert.deepEqual(oldNow,oldBefore)
await save('old-f5-protection-after.json',{beforeSource:'round02-old-f5-after-backup-roots.json',items:Object.keys(oldNow).length,current:oldNow,diffs:[]})
const packageRoot=repo+'/packages/dsh-pm-tool'
const complete=JSON.parse(await fs.readFile(out+'/combined-complete-inputs.json'))
for(const rel of ['src/commands/reflect.ts','src/core/reflect.ts','src/core/storage.ts','src/core/tasks.ts','src/core/milestones.ts','src/core/deliverables.ts','src/index.ts','src/client/panel.tsx']){
  const b=await fs.readFile(packageRoot+'/'+rel)
  assert.equal(sha(b),complete[rel].sha256)
  const dest=out+'/frozen-source/'+rel
  await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});await fs.writeFile(dest,b,{flag:'wx'})
  files['frozen-source/'+rel]={bytes:b.length,sha256:sha(b)}
}
const receipts=[]
for(const n of [2,3,4,5,6,7,8,9,10,11,12,13,14])receipts.push({round:n,...JSON.parse(await fs.readFile(out+'/round'+String(n).padStart(2,'0')+'-outer-receipt.json'))})
await save('execution-summary.json',{scope:'Original P1L2-F01 only, original two F5 reflection IDs, real composer edit/final/repeat/reload, 3268/PID9103 new CombinedSixRepairsR1',MainVerdict:'No independent GUI verdict; submitted for review',baseline:'9b1a8c5317774ff07cc594a0acd12a5cc7893ebd',commands:{round01:{observedToolExit:1,dispatch:false,reason:'New session text had shortcut suffix'},rounds:receipts},failures:{round04:'PM button before workspace initialisation had no panel; actual observed afterward, recovered one click in round06.',round06:'Content-only standard backup with file assets refused; actual .files.<fileBundleId> copied and normal file path precheck in round07.',round08:'Restore success; wait used wrong project name QA-G A instead of actual QA-A-fixture-F5. No restore replay.',round11:'Keyboard.type newline sent first line early; actual edit only one known line, raw mutation retained. Shift+Enter used for normal three-line correction in round12.',activationAttempt1:'Reader assumed trailing newline; actual 34-byte mapping comment had no newline, r2 matches uniquely.'},finalDelta:delta,oldF5Diffs:[]})
const index=Buffer.from(JSON.stringify({files},null,2))
await fs.writeFile(out+'/index-r1.json',index,{flag:'wx'})
for(const [rel,info] of Object.entries(files)){
  const b=await fs.readFile(out+'/'+rel);assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
}
await fs.writeFile(out+'/seal-r1.json',JSON.stringify({at:new Date().toISOString(),files:Object.keys(files).length,indexSha256:sha(index),exit:0,GUIVerdict:'NOT_RUN by independent expert'},null,2),{flag:'wx'})
console.log({files:Object.keys(files).length,delta,oldProtection:Object.keys(oldNow).length,exit:0})
