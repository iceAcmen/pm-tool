import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const source=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const out=repo+'/reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
if(process.argv[2]!=='inner'){
  const argv=['/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node',process.argv[1],'inner']
  const start=new Date().toISOString()
  const r=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:'utf8'})
  await fs.writeFile(out+'/seal-outer-receipt.json',JSON.stringify({argv,start,end:new Date().toISOString(),exit:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr},null,2),{flag:'wx'})
  console.log({exit:r.status,stdout:r.stdout,stderr:r.stderr});process.exitCode=r.status??1
}else{
  assert(!await fs.stat(out).catch(()=>null));await fs.mkdir(out)
  const files={}
  const include=rel=>/^round(15|16|17|19)([-.]|$)/.test(rel)||/^frames\/round(15|16|17|19)-/.test(rel)||/^(activation-binding-r2|combined-|browser-script-3|host-start|host-ready|host-setup-outer-receipt|harness-source|isolated-profile|gateway-binding|backup-copy-binding|sidecar-copy-binding)/.test(rel)
  async function walk(dir){
    for(const e of await fs.readdir(dir,{withFileTypes:true})){
      const p=dir+'/'+e.name,rel=p.slice(source.length+1)
      if(e.isDirectory())await walk(p)
      else if(include(rel)){
        const b=await fs.readFile(p),dest=out+'/'+rel
        await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});await fs.writeFile(dest,b,{flag:'wx'})
        files[rel]={bytes:b.length,sha256:sha(b)}
      }
    }
  }
  await walk(source)
  for(const rel of ['src/client/views/records/records-listbox.tsx','src/client/views/records/records-deliverable-pointer-dom.test.tsx','src/client/panel.tsx','src/client/views/records.css']){
    const path=repo+'/packages/dsh-pm-tool/'+rel,b=await fs.readFile(path),dest=out+'/frozen-source/'+rel
    await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});await fs.writeFile(dest,b,{flag:'wx'});files['frozen-source/'+rel]={bytes:b.length,sha256:sha(b)}
  }
  const roots=JSON.parse(await fs.readFile(out+'/round15-deliverable-list-roots.json'))
  const final=JSON.parse(await fs.readFile(out+'/round19-error-state-roots.json'))
  assert.deepEqual(roots,final)
  const summary=Buffer.from(JSON.stringify({scope:'Original P1L2-F02 pointer selection then single Main save, new actual six-repairs bundle 3268/PID9103. Submit observations to independent GUI expert; Main does not judge.',rounds:[15,16,17,19],notRun:[18],fixturePreparation:'round17 planned draft selection failed closure wait before save; no planned database preparation happened; round19 same draft accepted pointer selection and single save attempt',observed:'round17 field planned but menu remained; round19 accepted field/menu then Main save attempt; actual response and terminal receipts preserved',beforeAfterRootDifferences:[],source:'Existing original F02 contract; no new feature or permission'},null,2))
  await fs.writeFile(out+'/execution-summary.json',summary,{flag:'wx'});files['execution-summary.json']={bytes:summary.length,sha256:sha(summary)}
  const index=Buffer.from(JSON.stringify({files},null,2));await fs.writeFile(out+'/index-r1.json',index,{flag:'wx'})
  for(const [rel,info] of Object.entries(files)){const b=await fs.readFile(out+'/'+rel);assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)}
  await fs.writeFile(out+'/seal-r1.json',JSON.stringify({at:new Date().toISOString(),files:Object.keys(files).length,indexSha256:sha(index),exit:0,GUIVerdict:'NOT_RUN by independent expert'},null,2),{flag:'wx'})
  console.log({files:Object.keys(files).length,rootDiffs:[],exit:0})
}
