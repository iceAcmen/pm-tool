import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeR3'),repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const copies={
  'candidate.json':'reports/all-pending-evidence-20261021/CombinedF02RepairR2/candidate.json',
  'complete-inputs.json':'reports/all-pending-evidence-20261021/CombinedF02RepairR2/complete-inputs.json',
  'source-files.json':'reports/all-pending-evidence-20261021/CombinedF02RepairR2/source-files.json',
  'built-artifacts.json':'reports/all-pending-evidence-20261021/CombinedF02RepairR2/built-artifacts.json',
  'activation-binding.json':'reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/activation-binding.json',
  'original-r2-report.md':'docs/testing/p2-display-repair-gui-review-20261023-r2-report.md',
  'original-r2-final-roots.json':'reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/round10-final-a-roots.json',
  'harness-source.mjs':'/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs',
  'frozen-tasks.tsx':'/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool/src/client/views/tasks.tsx',
}
const bindings={}
for(const [dst,src]of Object.entries(copies)){
  const p=src.startsWith('/')?src:repo+'/'+src,b=await fs.readFile(p)
  await h.save(dst,b.toString('utf8'))
  bindings[dst]={original:src,bytes:b.length,sha256:h.sha(b)}
}
await h.save('original-bindings.json',bindings)
const entries={}
async function walk(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name
    if(e.isDirectory())await walk(p)
    else{
      assert(e.isFile())
      const rel=p.slice(h.out.length+1)
      if(['index-r1.json','seal.json','seal-outer-receipt.json'].includes(rel))continue
      const b=await fs.readFile(p)
      entries[rel]={bytes:b.length,sha256:h.sha(b)}
    }
  }
}
await walk(h.out)
const roots=Object.keys(entries).filter(n=>n.endsWith('-roots.json'))
const eventSummary=[]
for(const p of Object.keys(entries).filter(n=>n.endsWith('-events.json'))){
  const j=JSON.parse(await fs.readFile(h.out+'/'+p,'utf8'))
  eventSummary.push({file:p,frames:j.frames.length,requests:j.rows.filter(r=>r.type==='request').map(r=>r.body.payload.args.line)})
}
const writes=eventSummary.flatMap(e=>e.requests).filter(s=>s.startsWith('/pm task add '))
assert.equal(writes.length,3)
const b=Buffer.from(JSON.stringify(entries,null,2))
await h.save('index-r1.json',b.toString('utf8'))
await h.save('seal.json',{
  at:new Date().toISOString(),members:Object.keys(entries).length,indexSha256:h.sha(b),
  states:roots.length,eventSummary,preparationWrites:3,
  guiVerdict:'NOT_SELF_JUDGED; only original P2002 parent/children/collapse gap',
  retainedFailure:'prepare=1: parent command success already executed, wrong response wrapper assertion; follow creates only missing children',
  readPhase47RootsUnchanged:true,old44Unchanged:true,productChanges:0,
  excludes:['index-r1.json','seal.json','seal-outer-receipt.json'],
})
console.log(JSON.stringify({sealed:Object.keys(entries).length,indexSha256:h.sha(b),states:roots.length,eventSummary}))
