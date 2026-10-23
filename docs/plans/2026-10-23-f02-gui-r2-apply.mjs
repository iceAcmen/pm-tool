import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'r2apply')
  await page.click('.pm-restore-confirm')
  await page.waitForSelector('[role=dialog]',{timeout:4000})
  await h.state(page,'r2apply-explicit-confirm')
  const button=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='确认恢复'))
  assert(button.asElement())
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('/pm restore '),{timeout:12000})
  await button.asElement().click()
  const res=await waiting,body=await res.json()
  await h.save('r2apply-standard-restore-response.json',{status:res.status(),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>document.querySelector('.pm-shell')?.innerText.includes('QA-G A'),{timeout:6000})
  const ui=await h.state(page,'r2apply-restored-current-f5')
  const backup=JSON.parse(await fs.readFile(h.runtime+'/backups/current-f5-backup.json'))
  const rawById={},files=[]
  async function walk(dir){
    for(const e of await fs.readdir(dir,{withFileTypes:true})){
      const p=dir+'/'+e.name
      if(e.isDirectory())await walk(p)
      else{
        const bytes=await fs.readFile(p),wrapped=JSON.parse(bytes)
        const record=wrapped.record??wrapped
        if(record.id)rawById[record.id]={file:p.slice(h.runtime.length+1),record,sha256:h.sha(bytes),bytes:bytes.length}
      }
    }
  }
  await walk(h.runtime+'/data/pmtool')
  const rows=[...backup.projects,...backup.tasks,...Object.values(backup.extra??{}).flat()]
  for(const row of rows){
    assert(rawById[row.id],row.id)
    assert.deepEqual(rawById[row.id].record,row,'Restored standard record '+row.id)
    files.push({id:row.id,file:rawById[row.id].file,bytes:rawById[row.id].bytes,sha256:rawById[row.id].sha256})
  }
  await h.save('r2apply-backup-record-reconcile.json',{rows:rows.length,files,allRecordStructuresEqual:true,sessionsNotInBackup:true,independentGUI:'PENDING'})
  console.log({kind:body.result.value.result.kind,rows:rows.length,dialogs:ui.dialogs,text:ui.text?.slice(-1400)})
}catch(e){
  await h.save('r2apply-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'r2apply-error-state')
  throw e
}finally{if(stop)await stop();await browser.disconnect()}
