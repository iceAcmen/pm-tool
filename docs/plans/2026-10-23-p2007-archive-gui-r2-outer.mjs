import fs from 'node:fs'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/P2007ArchiveRepairGuiR2'
const node='/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const action=process.argv[2]
assert(['inspect','entry','export','files','filesfollow','reentry','reentryfollow','seal'].includes(action))
fs.mkdirSync(out,{recursive:true})
const script=repo+'/docs/plans/2026-10-23-p2007-archive-gui-r2-'+action+'.mjs'
const argv=[node,script],start=new Date().toISOString()
fs.writeFileSync(out+'/'+action+'-outer-start.json',JSON.stringify({start,argv,cwd:repo,parentPid:process.pid},null,2),{flag:'wx'})
fs.copyFileSync(script,out+'/'+action+'-executor-source.mjs',fs.constants.COPYFILE_EXCL)
const r=spawnSync(node,[script],{cwd:repo,encoding:'utf8',timeout:55000,maxBuffer:8*1024*1024})
fs.writeFileSync(out+'/'+action+'-outer-receipt.json',JSON.stringify({start,end:new Date().toISOString(),argv,cwd:repo,parentPid:process.pid,childPid:r.pid,status:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr},null,2),{flag:'wx'})
console.log(JSON.stringify({action,status:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr}))
process.exitCode=r.status??1
