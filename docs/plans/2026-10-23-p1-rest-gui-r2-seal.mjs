import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool',out=repo+'/reports/all-pending-evidence-20261021/P1RestVisibleR2'
const old=repo+'/reports/all-pending-evidence-20261021/P1HistoryRemainingR1'
const sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>JSON.parse(await fs.readFile(out+'/'+p)),save=async(p,v)=>fs.writeFile(out+'/'+p,typeof v==='string'?v:JSON.stringify(v,null,2),{flag:'wx'})
const baseline=JSON.parse(await fs.readFile(old+'/round16-final-roots.json'))
const names=await fs.readdir(out),rootChecks=[]
for(const name of names.filter(n=>n.endsWith('-roots.json'))){
  const roots=await read(name);assert.deepEqual(roots,baseline)
  let raw=0;const tag=name.slice(0,-'-roots.json'.length)
  for(const [rel,m]of Object.entries(roots).filter(([k])=>k.startsWith('data/pmtool/'))){
    const b=await fs.readFile(out+'/'+tag+'-raw/'+rel);assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256);raw++
  }
  rootChecks.push({name,roots:Object.keys(roots).length,raw,changes:[]})
}
for(const name of ['candidate-source-binding.json','host-ready.json','browser-script-binding.json','round16-final-roots.json'])
  await fs.writeFile(out+'/original-'+name,await fs.readFile(old+'/'+name),{flag:'wx'})
for(const rel of ['src/client/board/queue-aggregate.ts','src/client/board/cards/queue.tsx']){
  try{
    const dest=out+'/frozen-source/'+rel;await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
    await fs.writeFile(dest,await fs.readFile(old+'/frozen-source/'+rel),{flag:'wx'})
  }catch(e){if(e.code!=='ENOENT')throw e}
}
for(const name of ['plan.md','outer.mjs']){
  const file='2026-10-23-p1-rest-gui-r2-'+name
  await fs.writeFile(out+'/'+file,await fs.readFile(repo+'/docs/plans/'+file),{flag:'wx'})
}
await fs.writeFile(out+'/harness-source.mjs',await fs.readFile('/private/tmp/pmtool-p1-history-harness-20261023-r1.mjs'),{flag:'wx'})
const events={},requests=[],responses=[];let frames=0
for(const name of names.filter(n=>n.endsWith('-events.json'))){
  const e=await read(name)
  for(const f of e.frames)assert.equal(sha(await fs.readFile(out+'/'+f.file)),f.sha256)
  frames+=e.frames.length
  assert.equal(e.rows.filter(r=>r.type==='exception'||r.type==='unavailable-response').length,0)
  requests.push(...e.rows.filter(r=>r.type==='request'));responses.push(...e.rows.filter(r=>r.type==='response'))
  events[name]=e
}
for(const q of requests){assert.equal(q.body.payload.args.line,'/pm web snapshot');assert(responses.find(r=>r.body.rpcId===q.body.rpcId))}
const commands={}
for(const phase of ['entry','scroll','scrollfollow','return']){
  const r=await read(phase+'-outer-receipt.json');assert.equal(r.status,phase==='scroll'?1:0);commands[phase]=r
}
const rows=await read('round03-rest-rows.json')
assert(!rows.some(r=>r.title==='未跟进会话'))
assert(rows.some(r=>r.title==='仅缺席任务'&&r.project==='QA-G 仅缺席'&&r.absent==='会话有结存 · 未跟进'))
assert(rows.some(r=>r.title==='导出后改名'&&!r.muted))
await save('summary.json',{at:new Date().toISOString(),role:'Main raw GUI supplement; NOT independent PASS',candidate:'original114/521',port:3267,pid:3133,rootChecks,frames,events,commands,rows,newCandidateProtected:await read('round04-new-candidate-protected.json'),GUIVerdict:'PENDING',limits:['仅原P1001/P1002下部去重可见图；不重session跟进/TTL/restore/open，不签整P1/P1006/FL MAX/父commit','scroll1只是错误标题locator/last-child设施，原toggle展开成功保；follow只续已有展开列表滚动，无重toggle/业务写']})
const members={},exclude=new Set(['index-r1.json','seal-r1.json','seal-outer-receipt.json'])
async function walk(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name,rel=p.slice(out.length+1);if(exclude.has(rel))continue
    if(e.isDirectory())await walk(p)
    else{assert(e.isFile());const b=await fs.readFile(p);members[rel]={bytes:b.length,sha256:sha(b)}}
  }
}
await walk(out);await save('index-r1.json',{at:new Date().toISOString(),files:members})
await save('seal-r1.json',{at:new Date().toISOString(),members:Object.keys(members).length,indexSha256:sha(await fs.readFile(out+'/index-r1.json')),frames,rootStates:rootChecks.length,rootChanges:[],GUIVerdict:'PENDING independent review',excludes:[...exclude]})
console.log({members:Object.keys(members).length,indexSha256:sha(await fs.readFile(out+'/index-r1.json')),frames,rootStates:rootChecks.length,businessChanges:[]})
