import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {h,repo} from './2026-10-23-l8-refresh-r3-helper.mjs'
for(const root of [
  repo+'/packages/dsh-pm-tool',
  '/private/tmp/pmtool-combined-successor112-20261022-r1/packages/dsh-pm-tool',
]){
  const b=await fs.readFile(root+'/src/client/views/gantt.tsx')
  await h.save(root.startsWith(repo)?'current-gantt-source.tsx':'original-gantt-source.tsx',b.toString('utf8'))
}
await h.save('helper-source.mjs',await fs.readFile(repo+'/docs/plans/2026-10-23-l8-refresh-r3-helper.mjs','utf8'))
await h.save('harness-source.mjs',await fs.readFile('/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs','utf8'))
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
const records=[]
for(const name of Object.keys(entries).filter(n=>n.endsWith('-events.json'))){
  const j=JSON.parse(await fs.readFile(h.out+'/'+name,'utf8'))
  records.push({name,frames:j.frames.length,requests:j.rows.filter(r=>r.type==='request').map(r=>r.body.payload.args.line)})
}
assert(records.flatMap(r=>r.requests).every(s=>/^\/pm (web snapshot|ask-provenance |model status)/.test(s)))
const b=Buffer.from(JSON.stringify(entries,null,2))
await h.save('index-r1.json',b.toString('utf8'))
await h.save('seal.json',{
  at:new Date().toISOString(),candidate:'CombinedSuccessor112R1',source112:true,
  scope:'原L8既有页刷新疑点；未判GUI PASS',
  members:Object.keys(entries).length,indexSha256:h.sha(b),records,
  actualGanttOuter:1,reason:'旧全data保护断言捕捉宿主新会话缓存；业务/files/backups全同，原失败保留',
  mainReturned3269:true,current44Protected:true,
  excluded:['index-r1.json','seal.json','seal-outer-receipt.json'],
})
console.log(JSON.stringify({sealed:Object.keys(entries).length,indexSha256:h.sha(b),records}))
