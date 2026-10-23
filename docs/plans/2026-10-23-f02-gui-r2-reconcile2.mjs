import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('F02RepairGuiR2'),{browser,page}=await h.connect()
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const response=JSON.parse(await fs.readFile(h.out+'/r2apply-standard-restore-response.json'))
  assert.equal(response.body.result.value.result.kind,'success')
  const backup=JSON.parse(await fs.readFile(h.runtime+'/backups/current-f5-backup.json'))
  const ui=await h.state(page,'r2reconcile2-restored-current-f5')
  assert(ui.text.includes(backup.projects[0].name))
  const rows=[]
  for(const table of ['projects','tasks','milestones','riskIssues','meetings','reports','deliverables'])
    for(const record of backup[table])rows.push({table:table==='riskIssues'?'risk_issues':table,key:record.id,record})
  for(const [table,entries] of Object.entries(backup.extra))
    for(const [key,record] of entries)rows.push({table,key,record})
  const checked=[]
  for(const row of rows){
    const rel='data/pmtool/'+row.table+'/'+row.key+'.json'
    const bytes=await fs.readFile(h.runtime+'/'+rel),wrapped=JSON.parse(bytes)
    assert.deepEqual(wrapped.record??wrapped,row.record,rel)
    checked.push({table:row.table,key:row.key,file:rel,bytes:bytes.length,sha256:h.sha(bytes)})
  }
  await h.save('r2reconcile2-backup-records.json',{rows:rows.length,tables:13,checked,allRecordStructuresEqual:true,originalRestoreOuterExit:1,originalRestoreKind:'success',originalWaitName:'QA-G A',actualFirstProjectName:backup.projects[0].name,firstReaderExit:1,firstReaderError:'extra tables are [storageKey,record] tuples, not naked records',noRestoreReplay:true,sessionsNotInBackup:true,independentGUI:'PENDING'})
  console.log({rows:rows.length,tables:13,allRecordStructuresEqual:true,noRestoreReplay:true})
}finally{await browser.disconnect()}
