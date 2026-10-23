import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
const round=process.argv[2]
if(!/^round\d+$/.test(round??''))throw Error('Exact new round required')
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const script=repo+'/docs/plans/2026-10-23-six-repairs-gui-'+round+'.mjs'
const out=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
await fs.writeFile(out+'/'+round+'-source.mjs',await fs.readFile(script),{flag:'wx'})
const argv=['/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node',script]
const start=new Date().toISOString()
const result=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:'utf8',timeout:90000,maxBuffer:5e6})
await fs.writeFile(out+'/'+round+'-outer-receipt.json',JSON.stringify({start,end:new Date().toISOString(),argv,cwd:repo,exit:result.status,signal:result.signal,error:result.error?.message,stdout:result.stdout,stderr:result.stderr},null,2),{flag:'wx'})
console.log({round,exit:result.status,stdout:result.stdout,stderr:result.stderr})
process.exitCode=result.status??1
