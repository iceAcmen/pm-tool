import fs from 'node:fs'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2'
const node='/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const action=process.argv[2]
assert(['derive','start','backup','transfer','restore','precheck','precheck2','apply','reconcile','reconcile2','binding','prepare','pointer','keyboard','seal'].includes(action))
fs.mkdirSync(out,{recursive:true})
const marker=out+'/'+action+'-outer-start.json'
const script=['derive','start','backup','transfer','restore'].includes(action)?
  repo+'/docs/plans/2026-10-23-f02-gui-r2-execute.mjs':
  repo+'/docs/plans/2026-10-23-f02-gui-r2-'+action+'.mjs'
const argv=[script,...(['derive','start','backup','transfer','restore'].includes(action)?[action]:[])]
fs.writeFileSync(marker,JSON.stringify({at:new Date().toISOString(),argv:[node,...argv],cwd:repo,parentPid:process.pid},null,2),{flag:'wx'})
fs.copyFileSync(script,out+'/'+action+'-executor-source.mjs',fs.constants.COPYFILE_EXCL)
const start=new Date().toISOString()
const r=spawnSync(node,argv,{cwd:repo,encoding:'utf8',timeout:55000,maxBuffer:8*1024*1024})
fs.writeFileSync(out+'/'+action+'-outer-receipt.json',JSON.stringify({start,end:new Date().toISOString(),argv:r.spawnargs,cwd:repo,status:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr},null,2),{flag:'wx'})
console.log(JSON.stringify({action,status:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr}))
process.exitCode=r.status??1
