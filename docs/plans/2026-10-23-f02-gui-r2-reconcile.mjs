import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const response=JSON.parse(await fs.readFile(h.out+'/r2apply-standard-restore-response.json'))
  assert.equal(response.body.result.value.result.kind,'success')
  const backup=JSON.parse(await fs.readFile(h.runtime+'/backups/current-f5-backup.json'))
  const ui=await h.state(page,'r2reconcile-restored-current-f5')
  assert(ui.text.includes(backup.projects[0].name))
  const rawById={},files=[]
  async function walk(dir){
    for(const e of await fs.readdir(dir,{withFileTypes:true})){
      const p=dir+'/'+e.name
      if(e.isDirectory())await walk(p)
      else{
        const bytes=await fs.readFile(p),wrapped=JSON.parse(bytes),record=wrapped.record??wrapped
        if(record.id)rawById[record.id]={file:p.slice(h.runtime.length+1),record,sha256:h.sha(bytes),bytes:bytes.length}
      }
    }
  }
  await walk(h.runtime+'/data/pmtool')
  const rows=[...['projects','tasks','milestones','riskIssues','meetings','reports','deliverables'].flatMap(k=>backup[k]),...Object.values(backup.extra??{}).flat()]
  for(const row of rows){
    assert(rawById[row.id],row.id)
    assert.deepEqual(rawById[row.id].record,row,'Restored standard record '+row.id)
    files.push({id:row.id,file:rawById[row.id].file,bytes:rawById[row.id].bytes,sha256:rawById[row.id].sha256})
  }
  await h.save('r2reconcile-backup-records.json',{rows:rows.length,files,allRecordStructuresEqual:true,originalRestoreOuterExit:1,originalRestoreKind:'success',originalWaitName:'QA-G A',actualFirstProjectName:backup.projects[0].name,noRestoreReplay:true,sessionsNotInBackup:true,independentGUI:'PENDING'})
  console.log({rows:rows.length,allRecordStructuresEqual:true,noRestoreReplay:true})
}finally{await browser.disconnect()}
