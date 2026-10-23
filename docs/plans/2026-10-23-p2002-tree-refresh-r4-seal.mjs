import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2002TreeRefreshR4')
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
      const b=await fs.readFile(p);entries[rel]={bytes:b.length,sha256:h.sha(b)}
    }
  }
}
await walk(h.out)
const ev=JSON.parse(await fs.readFile(h.out+'/round01-refreshed-tree-visible-events.json','utf8'))
assert.equal(ev.rows.filter(r=>r.type==='request').length,1)
assert.equal(ev.rows.find(r=>r.type==='request').body.payload.args.line,'/pm web snapshot')
const b=Buffer.from(JSON.stringify(entries,null,2))
await h.save('index-r1.json',b.toString('utf8'))
await h.save('seal.json',{at:new Date().toISOString(),members:Object.keys(entries).length,indexSha256:h.sha(b),frames:ev.frames.length,scope:'仅原P2002刷新后三行同屏缺图，Main不自判PASS',root47Unchanged:true,requests:1,writes:0,excluded:['index-r1.json','seal.json','seal-outer-receipt.json']})
console.log(JSON.stringify({sealed:Object.keys(entries).length,indexSha256:h.sha(b),frames:ev.frames.length,root47Unchanged:true}))
