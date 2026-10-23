import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const runtime='/private/tmp/pmtool-six-repairs-gui-runtime-20261023-r1'
await fs.mkdir(out,{recursive:true})
const old=await fs.readFile(repo+'/reports/all-pending-evidence-20261021/Successor114GuiR1/host-setup-source.mjs','utf8')
const source=old.replaceAll('pmtool-successor114-gui-runtime-20261022-r1','pmtool-six-repairs-gui-runtime-20261023-r1')
  .replaceAll('Successor114GuiR1','SixRepairsGuiR1')
  .replaceAll('pmtool-combined-successor114-20261022-r1','pmtool-combined-six-repairs-20261023-r1')
  .replaceAll('CombinedSuccessor114R1','CombinedSixRepairsR1').replaceAll('3264','3268')
await fs.writeFile(out+'/host-setup-source.mjs',source,{flag:'wx'})
const harness=await fs.readFile('/private/tmp/pmtool-gui-capture-harness-20261023.mjs','utf8')
const newHarness=harness.replace("import {connect,runtime,textButton} from './pmtool-p0-context-metric-helper-20261023.mjs'",
  "import {connect,textButton} from './pmtool-p0-context-metric-helper-20261023.mjs'\nconst runtime="+JSON.stringify(runtime))
assert(newHarness!==harness)
await fs.writeFile('/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs',newHarness,{flag:'wx'})
await fs.writeFile(out+'/harness-source.mjs',newHarness,{flag:'wx'})
const start=new Date().toISOString()
const result=spawnSync('/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node',[out+'/host-setup-source.mjs'],{cwd:repo,encoding:'utf8',timeout:40000})
await fs.writeFile(out+'/host-setup-outer-receipt.json',JSON.stringify({start,end:new Date().toISOString(),argv:result.spawnargs,status:result.status,signal:result.signal,error:result.error?.message,stdout:result.stdout,stderr:result.stderr},null,2),{flag:'wx'})
console.log({exit:result.status,stdout:result.stdout,stderr:result.stderr})
process.exitCode=result.status??1
