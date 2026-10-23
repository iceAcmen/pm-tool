import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const combined=repo+'/reports/all-pending-evidence-20261021/CombinedSixRepairsR1'
const out=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const runtime='/private/tmp/pmtool-six-repairs-gui-runtime-20261023-r1'
const pkg='/private/tmp/pmtool-combined-six-repairs-20261023-r1/packages/dsh-pm-tool'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const complete=JSON.parse(await fs.readFile(combined+'/complete-inputs.json'))
for(const [rel,info] of Object.entries(complete))for(const root of [pkg,repo+'/packages/dsh-pm-tool']){
  const b=await fs.readFile(root+'/'+rel)
  assert.equal(b.length,info.bytes,root+'/'+rel);assert.equal(sha(b),info.sha256,root+'/'+rel)
}
for(const name of ['candidate.json','source-files.json','complete-inputs.json','built-artifacts.json']){
  const b=await fs.readFile(combined+'/'+name);await fs.writeFile(out+'/combined-'+name,b,{flag:'wx'})
}
const built=await fs.readFile(pkg+'/lib/client.js')
const omitted=Buffer.from('//# sourceMappingURL=client.js.map\n')
assert(built.subarray(-omitted.length).equals(omitted))
const body=built.subarray(0,-omitted.length)
const scripts=JSON.parse(await fs.readFile(out+'/browser-script-binding.json'))
const matches=[]
for(const item of scripts){
  const b=await fs.readFile(out+'/'+item.file)
  assert.equal(sha(b),item.sha256)
  const offset=b.indexOf(body)
  if(offset>=0){
    assert.equal(b.indexOf(body,offset+1),-1)
    matches.push({file:item.file,pathname:item.pathname,offset,bytes:body.length,sha256:sha(body),tailBytes:omitted.length,restoredBuiltSha256:sha(Buffer.concat([b.subarray(offset,offset+body.length),omitted]))})
  }
}
assert.equal(matches.length,1)
const head=spawnSync('/usr/bin/git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'})
assert.equal(head.status,0)
const pid=JSON.parse(await fs.readFile(out+'/host-start.json')).pid
const listening=spawnSync('/usr/sbin/lsof',['-nP','-iTCP:3268','-sTCP:LISTEN'],{encoding:'utf8'})
assert.equal(listening.status,0);assert(listening.stdout.includes(String(pid)))
const processInfo=spawnSync('/bin/ps',['-p',String(pid),'-o','pid=,command='],{encoding:'utf8'})
const processCwd=spawnSync('/usr/sbin/lsof',['-a','-p',String(pid),'-d','cwd'],{encoding:'utf8'})
await fs.writeFile(out+'/activation-binding.json',JSON.stringify({at:new Date().toISOString(),baseline:head.stdout.trim(),completeInputs:Object.keys(complete).length,currentAndFrozenInputsMatch:true,builtBytes:built.length,builtSha256:sha(built),matches,profileLink:await fs.readlink(runtime+'/home/profiles/pm/node_modules/dsh-pm-tool'),pid,port:3268,listening:{exit:listening.status,stdout:listening.stdout},process:{exit:processInfo.status,stdout:processInfo.stdout},cwd:{exit:processCwd.status,stdout:processCwd.stdout},GUIVerdict:'NOT_RUN by independent expert'},null,2),{flag:'wx'})
console.log({inputs:Object.keys(complete).length,matches,pid,exit:0})
