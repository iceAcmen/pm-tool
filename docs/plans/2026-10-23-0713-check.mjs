import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const checked=[]
const base=repo+'/reports/all-pending-evidence-20261021/'
const complete=JSON.parse(await fs.readFile(base+'SixRepairsGuiR1/combined-complete-inputs.json','utf8'))
for(const [rel,info] of Object.entries(complete)) {
  const b=await fs.readFile(repo+'/packages/dsh-pm-tool/'+rel)
  assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
}
for(const name of ['P3004NegativeGuiR1','F02OptionNativeTraceR2']) {
  const index=JSON.parse(await fs.readFile(base+name+'/index-r1.json','utf8'))
  for(const [rel,info] of Object.entries(index.files)) {
    const b=await fs.readFile(base+name+'/'+rel)
    assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
  }
  checked.push({name,members:Object.keys(index.files).length})
}
const scripts=[
  ...Array.from({length:9},(_,i)=>'docs/plans/2026-10-23-six-repairs-gui-round'+(20+i)+'.mjs'),
  'docs/plans/2026-10-23-p3004-negative-gui-seal.mjs',
  'docs/plans/2026-10-23-f02-option-native-trace-seal.mjs',
  'docs/plans/2026-10-23-0713-check.mjs',
]
const syntax=scripts.map(rel=>{
  const argv=[process.execPath,'--check',repo+'/'+rel]
  const r=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:'utf8'})
  assert.equal(r.status,0,r.stderr)
  return {argv,exit:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr}
})
const links=[]
for(const rel of ['docs/plans/2026-10-23-0713-continuation.md','docs/plans/2026-10-23-f02-option-default-repair.md']) {
  const text=await fs.readFile(repo+'/'+rel,'utf8')
  assert(!text.split('\n').some(s=>/[ \t]+$/.test(s)))
  for(const m of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target=m[1].split('#')[0]
    if(!target||/^(https?:|file:)/.test(target))continue
    const path=new URL(target,'file://'+repo+'/'+rel).pathname
    assert(await fs.stat(path),target)
    links.push({rel,target})
  }
}
const git=spawnSync('git',['diff','--check'],{cwd:repo,encoding:'utf8'})
assert.equal(git.status,0,git.stdout+git.stderr)
const result={at:new Date().toISOString(),sourceInputs:Object.keys(complete).length,sourceDrift:[],checked,syntax,links,git:{argv:['git','diff','--check'],exit:git.status,stdout:git.stdout,stderr:git.stderr},exit:0,boundary:'Main源件/自有证据/文档检查，不是独立SOURCE/AUTO或GUI PASS；无产品源码改动，无build/整回归重跑。'}
await fs.writeFile(base+'SixRepairsGuiR1/continuation-0713-check.json',JSON.stringify(result,null,2),{flag:'wx'})
console.log({sourceInputs:result.sourceInputs,checked,syntax:syntax.length,links:links.length,gitDiffCheck:git.status,exit:0})
