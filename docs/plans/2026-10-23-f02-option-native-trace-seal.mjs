import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {spawnSync} from 'node:child_process'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const source=repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1'
const out=repo+'/reports/all-pending-evidence-20261021/F02OptionNativeTraceR2'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
if(process.argv[2]!=='inner') {
  const argv=[process.execPath,process.argv[1],'inner'],start=new Date().toISOString()
  const r=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:'utf8'})
  await fs.writeFile(out+'/seal-outer-receipt.json',JSON.stringify({argv,start,end:new Date().toISOString(),exit:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr},null,2),{flag:'wx'})
  console.log({exit:r.status,stdout:r.stdout,stderr:r.stderr});process.exitCode=r.status??1
} else {
  assert(!await fs.stat(out).catch(()=>null));await fs.mkdir(out)
  const files={}
  async function store(rel,b) {
    const dest=out+'/'+rel
    await fs.mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true})
    await fs.writeFile(dest,b,{flag:'wx'});files[rel]={bytes:b.length,sha256:sha(b)}
  }
  const include=rel=>/^round(26|27|28)([-.]|$)/.test(rel)||/^frames\/round(26|27|28)-/.test(rel)||/^(activation-binding-r2|combined-|browser-script-3|host-start|host-ready|host-setup-outer-receipt|harness-source)/.test(rel)
  async function walk(dir) {
    for(const e of await fs.readdir(dir,{withFileTypes:true})) {
      const p=dir+'/'+e.name,rel=p.slice(source.length+1)
      if(e.isDirectory())await walk(p)
      else if(include(rel))await store(rel,await fs.readFile(p))
    }
  }
  await walk(source)
  const complete=JSON.parse(await fs.readFile(out+'/combined-complete-inputs.json','utf8'))
  for(const rel of ['src/client/views/records/records-listbox.tsx','src/client/views/records/records-deliverable-form.tsx','src/client/views/records/records-deliverable-pointer-dom.test.tsx','src/client/views/records/records-overlay.tsx','src/client/views/records.css']) {
    const b=await fs.readFile(repo+'/packages/dsh-pm-tool/'+rel)
    assert.deepEqual({bytes:b.length,sha256:sha(b)},complete[rel])
    await store('frozen-source/'+rel,b)
  }
  const baseline=JSON.parse(await fs.readFile(out+'/round27-original-deliverable-list-roots.json','utf8'))
  const states=['round27-original-deliverable-diagnostic-start','round28-before-passive-observation','round28-status-menu-before-selection','round28-after-planned-pointer-selection','round28-stable-selection-end','round28-after-normal-cancel']
  for(const state of states)assert.deepEqual(JSON.parse(await fs.readFile(out+'/'+state+'-roots.json','utf8')),baseline)
  const trace=JSON.parse(await fs.readFile(out+'/round28-native-click-observations.json','utf8'))
  assert.equal(trace.clicks.length,6)
  const cleanup=JSON.parse(await fs.readFile(out+'/round28-observer-removal-after-clicks.json','utf8'))
  assert(cleanup.unchanged)
  await store('execution-summary.json',Buffer.from(JSON.stringify({
    scope:'原F02优先假设的Main辅助原生click诊断；不签GUI或原失败归因更正。',
    trace:'同真实option span detail1/trusted click先使expanded false；随后非Main输入trigger button detail0/trusted click令expanded true。两次均defaultPrevented=false；完整capture/bubble/composedPath见原件。',
    closureWait:'4000ms未关闭；本采证执行outer0表示收集成功，不是产品PASS。',
    roots:{count:Object.keys(baseline).length,states:[ 'round27-original-deliverable-list',...states],differences:[]},
    cleanup:'仅浏览器passive document click监听；已移除两监听，随后真实backdrop/cancel未新增debug事件，console标签无产品源码写。',
    readinessFailure:'round26 .pm-shell初挂时项目按钮尚未ready，无RPC；原error/outer1保，round27从观察后正常继续。',
    independentVerdict:'PENDING',
  },null,2)))
  await store('main-seal-source.mjs',await fs.readFile(process.argv[1]))
  const index=Buffer.from(JSON.stringify({files},null,2));await fs.writeFile(out+'/index-r1.json',index,{flag:'wx'})
  for(const [rel,info] of Object.entries(files)) {
    const b=await fs.readFile(out+'/'+rel);assert.equal(b.length,info.bytes);assert.equal(sha(b),info.sha256)
  }
  await fs.writeFile(out+'/seal-r1.json',JSON.stringify({at:new Date().toISOString(),files:Object.keys(files).length,indexSha256:sha(index),exit:0,independentVerdict:'PENDING'},null,2),{flag:'wx'})
  console.log({files:Object.keys(files).length,clicks:6,roots:Object.keys(baseline).length,rootDifferences:[],exit:0})
}
