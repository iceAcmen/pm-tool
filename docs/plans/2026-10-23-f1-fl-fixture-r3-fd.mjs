import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F1FLFixtureR3'
const own='/private/tmp/pmtool-f1-fl-fixture-20261023-r3-dense'
assert(!fs.existsSync(own));fs.mkdirSync(own,{recursive:true})
const save=(n,v)=>fs.writeFileSync(out+'/'+n,JSON.stringify(v,null,2),{flag:'wx'})
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
process.env.DSH_PM_ISOLATED_ROOT=own;process.env.DSH_PM_FILE_ROOT=own+'/files';process.env.DSH_PM_BACKUP_DIR=own+'/backups'
const req=createRequire(pkg+'/package.json')
const dependency=async n=>import(pathToFileURL(req.resolve(n)).href)
const {Context}=await dependency('@deepseek-ai/cordis')
const {default:Storage}=await dependency('@deepseek-ai/dsh-storage')
const {JsonStorageBackend}=await dependency('@deepseek-ai/dsh-storage-json')
const {DomainFacility}=await dependency('@deepseek-ai/dsh-storage-domain')
const load=async n=>import(pathToFileURL(pkg+'/lib/'+n+'.js').href)
const {apply}=await load('index')
const {updateTask}=await load('core/tasks')
const {collectBackup,precheckBackupFile,restoreBackup,precheckBackupContent,restoreBackupFromContent,createBackup}=await load('core/backup')
const {groupOpenTasksByAssignee}=await load('core/people-load')
const {loadFacts,stanceSuggestions,staleStanceTags}=await load('core/load-stance')
const {loadScale}=await load('client/views/people-scale')
const ctx=new Context();await ctx.plugin(Storage)
ctx.storage.backend.register('json',new JsonStorageBackend(own+'/domain'))
const facility=new DomainFacility(ctx,{backend:'json',routes:{}})
ctx.provide('storageDomain',facility);ctx.provide('commands',{register(){return()=>{}}});await apply(ctx)
const domain=facility.get('pmtool')
const previous=JSON.parse(fs.readFileSync(out+'/fl-result.json','utf8'))
const original=JSON.parse(fs.readFileSync(out+'/fl-oracle.json','utf8')),ids=original.ids
const actions=[]
try{
  const valid=await precheckBackupFile(previous.standardPath)
  await restoreBackup(domain,previous.standardPath,own+'/initial-safety')
  const A=valid.tasks.filter(t=>t.projectId===ids.A)
  const assigned=A.filter(t=>t.assignee)
  assert.equal(assigned.length,22)
  const names=[]
  for(let i=0;i<20;i++){const prefix='FD负责人'+String(i+1).padStart(2,'0');names.push(prefix+'长'.repeat(80-prefix.length))}
  for(let i=0;i<assigned.length;i++){
    const assignee=names[i<20?i:i-20]
    const result=await updateTask(domain,assigned[i].id,{assignee})
    actions.push({at:new Date().toISOString(),id:assigned[i].id,input:{assignee},result})
    save('fd-actions-'+actions.length+'.json',actions)
  }
  const history=collectBackup(domain)
  for(const task of history.tasks){
    const old=valid.tasks.find(t=>t.id===task.id)
    task.createdAt=old.createdAt;task.updatedAt=old.updatedAt
  }
  save('fd-legal-history-content.json',history)
  await precheckBackupContent(JSON.stringify(history))
  const restored=await restoreBackupFromContent(domain,JSON.stringify(history),own+'/history-safety')
  save('fd-history-restored.json',{safetySnapshot:restored.safetySnapshot,backup:restored.backup})
  const summary=await createBackup(domain,own+'/backups')
  const verified=await precheckBackupFile(summary.path)
  const bytes=fs.readFileSync(summary.path)
  fs.copyFileSync(summary.path,out+'/fd-standard-backup.json',fs.constants.COPYFILE_EXCL)
  if(verified.fileBundleId)fs.cpSync(summary.path+'.files.'+verified.fileBundleId,out+'/fd-standard-backup.json.files.'+verified.fileBundleId,{recursive:true,errorOnExist:true,force:false})
  const actual=verified.tasks.filter(t=>t.projectId===ids.A)
  assert.equal(new Set(actual.filter(t=>t.assignee).map(t=>t.assignee)).size,20)
  assert.equal(actual.length,24);assert.equal(actual.filter(t=>!t.assignee).length,2)
  const report=groupOpenTasksByAssignee(actual,verified.projects,{today:previous.date})
  const scale=loadScale(report.people.map(r=>r.openTotal),report.unassigned.openTotal,5)
  const facts=loadFacts(actual,{today:previous.date}),suggestions=stanceSuggestions(actual,{today:previous.date}),tags=staleStanceTags(actual,{today:previous.date})
  assert(tags.some(t=>t.taskId===ids.T01));assert(suggestions.some(t=>t.taskId===ids.B01&&t.stance==='slow'))
  save('fd-oracle.json',{date:previous.date,ids,names,taskAssigneeMapping:actual.map(t=>({id:t.id,status:t.status,assignee:t.assignee})),report,scale,facts,suggestions,tags,F1CountsPreserved:true,distinctAssigned20:true,mainGeneratedNotIndependentPass:true})
  save('fd-result.json',{date:previous.date,own,pkg,standardPath:summary.path,copiedPath:out+'/fd-standard-backup.json',bytes:bytes.length,sha256:hash(bytes),bundleId:verified.fileBundleId,counts:summary.counts,sourceCandidate:'CombinedF02RepairR2',mainGeneratedNotIndependentPass:true})
  console.log(JSON.stringify({prepared:true,taskCount:actual.length,distinctAssigned:20,scale,backupSha256:hash(bytes)}))
}catch(e){save('fd-error.json',{error:String(e),stack:e.stack,actionCount:actions.length});throw e}
