import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import crypto from 'node:crypto'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F02RepairGuiR2'
const runtime='/private/tmp/pmtool-f02-repair-gui-runtime-20261023-r2'
const oldRuntime='/private/tmp/pmtool-six-repairs-gui-runtime-20261023-r1'
const node='/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const action=process.argv[2]
assert(['derive','start','backup','transfer','restore'].includes(action),'Explicit bounded action required')
await fs.mkdir(out,{recursive:true})
const save=async(name,value)=>fs.writeFile(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'})
if(action==='derive'){
  const source=await fs.readFile(repo+'/reports/all-pending-evidence-20261021/SixRepairsGuiR1/host-setup-source.mjs','utf8')
  const updated=source.replaceAll('pmtool-six-repairs-gui-runtime-20261023-r1','pmtool-f02-repair-gui-runtime-20261023-r2')
    .replaceAll('SixRepairsGuiR1','F02RepairGuiR2')
    .replaceAll('pmtool-combined-six-repairs-20261023-r1','pmtool-combined-f02-repair-20261023-r2')
    .replaceAll('CombinedSixRepairsR1','CombinedF02RepairR2').replaceAll('3268','3269')
  assert(updated!==source)
  await save('host-setup-source.mjs',updated)
  const harness=await fs.readFile('/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs','utf8')
  const updatedHarness=harness.replaceAll(oldRuntime,runtime)
  assert(updatedHarness!==harness)
  await fs.writeFile('/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs',updatedHarness,{flag:'wx'})
  await save('harness-source.mjs',updatedHarness)
  const port=spawnSync('/usr/sbin/lsof',['-nP','-iTCP:3269','-sTCP:LISTEN'],{encoding:'utf8'})
  assert.equal(port.status,1);assert.equal(port.stdout,'')
  await save('derivation.json',{at:new Date().toISOString(),hostSource:{originalSha256:sha(Buffer.from(source)),derivedSha256:sha(Buffer.from(updated))},harness:{originalSha256:sha(Buffer.from(harness)),derivedSha256:sha(Buffer.from(updatedHarness))},runtime,out,portCheck:{argv:port.spawnargs,exit:port.status,stdout:port.stdout,stderr:port.stderr},independentGUI:'NOT_RUN',startsHost:false})
  console.log({action,derived:true,startsHost:false})
}else if(action==='start'){
  const report=await fs.readFile(repo+'/docs/testing/f02-combined-regression-review-20261023-r2-report.md','utf8')
  assert(report.includes('PASS'),'Independent report must be read and assessed by Main before invoking start')
  const port=spawnSync('/usr/sbin/lsof',['-nP','-iTCP:3269','-sTCP:LISTEN'],{encoding:'utf8'})
  assert.equal(port.status,1);assert.equal(port.stdout,'')
  await save('start-port-check.json',{at:new Date().toISOString(),argv:port.spawnargs,exit:port.status,stdout:port.stdout,stderr:port.stderr,independentReportSha256:sha(Buffer.from(report))})
  const start=new Date().toISOString()
  const r=spawnSync(node,[out+'/host-setup-source.mjs'],{cwd:repo,encoding:'utf8',timeout:40000})
  await save('host-setup-outer-receipt.json',{start,end:new Date().toISOString(),argv:r.spawnargs,status:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr})
  console.log({action,exit:r.status,stdout:r.stdout,stderr:r.stderr})
  process.exitCode=r.status??1
}else if(action==='backup'){
  const {createHarness}=await import('/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs')
  const h=createHarness('F02RepairGuiR2')
  const {browser,page}=await h.connect()
  let stop
  try{
    assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3268')
    stop=await h.record(page,'r2backup')
    await h.state(page,'r2backup-old-before')
    const visibleEditor=await page.evaluate(()=>!![...document.querySelectorAll('[contenteditable=true]')].find(n=>n.getClientRects().length))
    if(!visibleEditor){
      const b=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim().startsWith('新会话')))
      assert(b.asElement());await b.asElement().click()
      await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
    }
    const response=await h.command(page,'/pm backup','r2backup-normal')
    assert.equal(response.result.value.result.kind,'success')
    await h.state(page,'r2backup-old-after')
    console.log({action,kind:response.result.value.result.kind})
  }catch(e){
    await h.save('r2backup-error.json',{error:String(e),stack:e.stack})
    await h.state(page,'r2backup-error-state')
    throw e
  }finally{if(stop)await stop();await browser.disconnect()}
}else if(action==='transfer'){
  const response=JSON.parse(await fs.readFile(out+'/r2backup-normal-command.json'))
  const result=response.body.result.value.result
  assert.equal(result.kind,'success')
  const source=result.text.match(/文件：([^\n]+)/)?.[1]?.trim()
  assert(source?.startsWith(oldRuntime+'/backups/'))
  const target=runtime+'/backups/current-f5-backup.json'
  const content=await fs.readFile(source),doc=JSON.parse(content)
  assert(doc.fileBundleId,'Use the actual standard sidecar suffix')
  await fs.copyFile(source,target,fs.constants.COPYFILE_EXCL)
  const sidecarSource=source+'.files.'+doc.fileBundleId
  const sidecarTarget=target+'.files.'+doc.fileBundleId
  assert(!(await fs.stat(sidecarTarget).catch(()=>null)))
  await fs.cp(sidecarSource,sidecarTarget,{recursive:true,errorOnExist:true,force:false})
  const items=[]
  async function walk(dir){
    for(const e of await fs.readdir(dir,{withFileTypes:true})){
      const p=dir+'/'+e.name
      if(e.isDirectory())await walk(p)
      else{
        const rel=p.slice(sidecarTarget.length+1),b=await fs.readFile(p),a=await fs.readFile(sidecarSource+'/'+rel)
        assert.deepEqual(b,a)
        items.push({rel,bytes:b.length,sha256:sha(b)})
      }
    }
  }
  await walk(sidecarTarget)
  assert.deepEqual(content,await fs.readFile(target))
  await save('original-f5-backup.json',content.toString())
  await save('backup-copy-binding.json',{at:new Date().toISOString(),source,target,bytes:content.length,sha256:sha(content),sidecarSource,sidecarTarget,items,counts:{projects:doc.projects.length,tasks:doc.tasks.length},extra:Object.fromEntries(Object.entries(doc.extra??{}).map(([k,v])=>[k,v.length])),normalBackup:true,noJSONChanges:true})
  console.log({action,projects:doc.projects.length,tasks:doc.tasks.length,sidecarFiles:items.length})
}else if(action==='restore'){
  const {createHarness}=await import('/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs')
  const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
  let stop
  const pending=[]
  const scriptRows=[]
  const onResponse=res=>{
    const pathname=new URL(res.url()).pathname
    if((res.headers()['content-type']??'').includes('javascript'))pending.push(res.buffer().then(async b=>{
      const file='browser-script-'+scriptRows.length+'.js'
      scriptRows.push({pathname,file,bytes:b.length,sha256:sha(b)})
      await fs.writeFile(out+'/'+file,b,{flag:'wx'})
    }))
  }
  page.on('response',onResponse)
  try{
    assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3268')
    stop=await h.record(page,'r2restore')
    await page.goto((await fs.readFile(runtime+'/private/entry-url','utf8')).trim(),{waitUntil:'networkidle0',timeout:20000})
    assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
    await page.waitForSelector('[aria-label="项目管理"]',{timeout:10000})
    const later=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim()==='稍后再说'))
    if(later.asElement())await later.asElement().click()
    await page.click('[aria-label="项目管理"]')
    await page.waitForSelector('.pm-shell',{timeout:8000})
    const initial=await h.state(page,'r2restore-new-empty')
    console.log({action,initialText:initial.text?.slice(-1400),fields:initial.fields,buttons:initial.buttons.slice(-14)})
  }catch(e){
    await h.save('r2restore-error.json',{error:String(e),stack:e.stack})
    await h.state(page,'r2restore-error-state')
    throw e
  }finally{
    page.off('response',onResponse);await Promise.all(pending)
    await save('browser-script-binding.json',scriptRows)
    if(stop)await stop();await browser.disconnect()
  }
}
