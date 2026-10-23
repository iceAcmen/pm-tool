import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F1FLFixtureR3'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const save=(n,v)=>fs.writeFileSync(out+'/'+n,JSON.stringify(v,null,2),{flag:'wx'})
const artifactPath=repo+'/reports/all-pending-evidence-20261021/CombinedF02RepairR2/built-artifacts.json'
const artifacts=JSON.parse(fs.readFileSync(artifactPath,'utf8'))
const verified=[]
for(const [rel,m]of Object.entries(artifacts)){
  const b=fs.readFileSync(pkg+'/lib/'+rel)
  assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256)
  verified.push({file:rel,...m})
}
save('frozen-artifacts-verified.json',{count:verified.length,verified,manifest:{path:artifactPath,sha256:sha(fs.readFileSync(artifactPath))}})
for(const [dst,src]of [
  ['candidate.json','reports/all-pending-evidence-20261021/CombinedF02RepairR2/candidate.json'],
  ['source-files.json','reports/all-pending-evidence-20261021/CombinedF02RepairR2/source-files.json'],
  ['complete-inputs.json','reports/all-pending-evidence-20261021/CombinedF02RepairR2/complete-inputs.json'],
  ['built-artifacts.json','reports/all-pending-evidence-20261021/CombinedF02RepairR2/built-artifacts.json'],
  ['schema-locator.md','docs/plans/2026-10-23-f1-fl-production-schema-r3.md'],
]){
  fs.copyFileSync(repo+'/'+src,out+'/'+dst,fs.constants.COPYFILE_EXCL)
}
const expected=JSON.parse(fs.readFileSync(repo+'/reports/all-pending-evidence-20261021/P2002TreeR3/round04-tree-after-reload-roots.json','utf8'))
const runtime='/private/tmp/pmtool-f02-repair-gui-runtime-20261023-r2',protectedRoots={}
for(const root of ['data/pmtool','files','backups']){
  function walk(dir){
    if(!fs.existsSync(dir))return
    for(const e of fs.readdirSync(dir,{withFileTypes:true})){
      const p=dir+'/'+e.name
      if(e.isDirectory())walk(p)
      else{const b=fs.readFileSync(p);protectedRoots[p.slice(runtime.length+1)]={bytes:b.length,sha256:sha(b)}}
    }
  }
  walk(runtime+'/'+root)
}
assert.deepEqual(protectedRoots,expected)
save('current-runtime-protected.json',{count:Object.keys(protectedRoots).length,roots:protectedRoots,equalP2002TreeR3Final:true})
const entries={}
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name
    if(e.isDirectory())walk(p)
    else{
      assert(e.isFile())
      const rel=p.slice(out.length+1)
      if(['index-r1.json','seal.json','seal-outer-receipt.json'].includes(rel))continue
      const b=fs.readFileSync(p);entries[rel]={bytes:b.length,sha256:sha(b)}
    }
  }
}
walk(out)
save('index-r1.json',entries)
save('seal.json',{
  at:new Date().toISOString(),date:'2026-10-23',members:Object.keys(entries).length,indexSha256:sha(fs.readFileSync(out+'/index-r1.json')),
  variants:['base','fl','fd'],eachActualProductionPrecheckAndRestore:true,
  frozenBuildArtifactsVerified:verified.length,currentRuntime47Unchanged:true,
  productChanges:0,GUIExecutions:0,verdict:'MAIN_FIXTURE_PREPARATION_ONLY_NOT_INDEPENDENT_PASS',
  excludes:['index-r1.json','seal.json','seal-outer-receipt.json'],
})
console.log(JSON.stringify({sealed:Object.keys(entries).length,indexSha256:sha(fs.readFileSync(out+'/index-r1.json')),artifacts:verified.length,protectedRoots:Object.keys(protectedRoots).length}))
