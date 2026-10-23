import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const first=await fs.readFile(repo+'/docs/plans/2026-10-23-six-repairs-gui-binding.mjs','utf8')
await fs.writeFile(out+'/activation-binding-attempt1-source.mjs',first,{flag:'wx'})
await fs.writeFile(out+'/activation-binding-attempt1.json',JSON.stringify({exit:1,reason:'Reader assumed trailing newline after sourceMappingURL; actual bundle has no trailing newline.',observedToolExit:1,productChanges:false},null,2),{flag:'wx'})
const corrected=first.replace("Buffer.from('//# sourceMappingURL=client.js.map\\n')","Buffer.from('//# sourceMappingURL=client.js.map')")
  .replace("await fs.writeFile(out+'/combined-'+name,b,{flag:'wx'})","assert.deepEqual(await fs.readFile(out+'/combined-'+name),b)")
  .replace("out+'/activation-binding.json'","out+'/activation-binding-r2.json'")
await fs.writeFile(out+'/activation-binding-r2-source.mjs',corrected,{flag:'wx'})
const argv=['/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node',out+'/activation-binding-r2-source.mjs']
const start=new Date().toISOString()
const result=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:'utf8'})
await fs.writeFile(out+'/activation-binding-r2-outer.json',JSON.stringify({argv,start,end:new Date().toISOString(),exit:result.status,signal:result.signal,stdout:result.stdout,stderr:result.stderr},null,2),{flag:'wx'})
console.log({exit:result.status,stdout:result.stdout,stderr:result.stderr})
process.exitCode=result.status??1
