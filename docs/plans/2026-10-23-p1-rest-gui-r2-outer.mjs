import fs from 'node:fs'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool',out=repo+'/reports/all-pending-evidence-20261021/P1RestVisibleR2'
const node='/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node',action=process.argv[2]
assert(['entry','scroll','scrollfollow','return','seal'].includes(action));fs.mkdirSync(out,{recursive:true})
const script=repo+'/docs/plans/2026-10-23-p1-rest-gui-r2-'+action+'.mjs',argv=[node,script],start=new Date().toISOString()
fs.writeFileSync(out+'/'+action+'-outer-start.json',JSON.stringify({argv,start,cwd:repo,parentPid:process.pid},null,2),{flag:'wx'})
fs.copyFileSync(script,out+'/'+action+'-source.mjs',fs.constants.COPYFILE_EXCL)
const r=spawnSync(node,[script],{cwd:repo,encoding:'utf8',timeout:55000,maxBuffer:8*1024*1024})
fs.writeFileSync(out+'/'+action+'-outer-receipt.json',JSON.stringify({argv,start,end:new Date().toISOString(),cwd:repo,parentPid:process.pid,childPid:r.pid,status:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr},null,2),{flag:'wx'})
console.log(JSON.stringify({action,status:r.status,stdout:r.stdout,stderr:r.stderr}));process.exitCode=r.status??1
