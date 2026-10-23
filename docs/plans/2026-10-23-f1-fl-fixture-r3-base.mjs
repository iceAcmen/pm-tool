import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F1FLFixtureR3'
const own='/private/tmp/pmtool-f1-fl-fixture-20261023-r3'
assert(!fs.existsSync(own));fs.mkdirSync(own,{recursive:true})
fs.mkdirSync(out,{recursive:true})
const save=(n,v)=>fs.writeFileSync(out+'/'+n,JSON.stringify(v,null,2),{flag:'wx'})
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
process.env.DSH_PM_ISOLATED_ROOT=own
process.env.DSH_PM_FILE_ROOT=own+'/files'
process.env.DSH_PM_BACKUP_DIR=own+'/backups'
const req=createRequire(pkg+'/package.json')
const dependency=async n=>import(pathToFileURL(req.resolve(n)).href)
const {Context}=await dependency('@deepseek-ai/cordis')
const {default:Storage}=await dependency('@deepseek-ai/dsh-storage')
const {JsonStorageBackend}=await dependency('@deepseek-ai/dsh-storage-json')
const {DomainFacility}=await dependency('@deepseek-ai/dsh-storage-domain')
const load=async n=>import(pathToFileURL(pkg+'/lib/'+n+'.js').href)
const {apply}=await load('index')
const {addProject}=await load('core/projects')
const {addTask}=await load('core/tasks')
const {collectBackup,precheckBackupContent,restoreBackupFromContent,createBackup,precheckBackupFile}=await load('core/backup')
const {loadFacts,stanceSuggestions,staleStanceTags}=await load('core/load-stance')
const {groupOpenTasksByAssignee}=await load('core/people-load')
const {loadScale}=await load('client/views/people-scale')
const ctx=new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json',new JsonStorageBackend(own+'/domain'))
const facility=new DomainFacility(ctx,{backend:'json',routes:{}})
ctx.provide('storageDomain',facility)
ctx.provide('commands',{register(){return()=>{}}})
await apply(ctx)
const domain=facility.get('pmtool')
const now=new Date(),D=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')
const day=n=>new Date(Date.parse(D)+n*86400000).toISOString().slice(0,10)
const iso=n=>day(n)+'T00:00:00.000Z'
const actions=[],ids={}
const record=async(alias,method,payload)=>{
  const result=await method(domain,payload)
  ids[alias]=result.id
  actions.push({alias,at:new Date().toISOString(),payload,result})
  save('base-actions-'+actions.length+'.json',actions)
  return result
}
try{
  const A=await record('A',addProject,{name:'QA-A-F1R3',startDate:day(-60),targetDate:day(60)})
  const B=await record('B',addProject,{name:'QA-B-F1R3',startDate:day(-60),targetDate:day(60)})
  const rows=[]
  for(const [prefix,status,count]of [['T','todo',8],['I','in_progress',6],['B','blocked',2],['D','done',7],['W','wrapped',1]]){
    for(let i=1;i<=count;i++){
      const alias=prefix+String(i).padStart(2,'0')
      const assignee=prefix==='T'?(i<=4?'测试甲':i<=6?'测试乙':''):prefix==='I'?(i<=3?'测试甲':'测试乙'):prefix==='B'?(i===1?'测试甲':'测试乙'):prefix==='D'?(i<=4?'测试甲':'测试乙'):'测试甲'
      const dueOffset=['T01','B02'].includes(alias)||status==='done'||status==='wrapped'?-1:['T02','T07'].includes(alias)?0:7
      rows.push(await record(alias,addTask,{
        projectId:A.id,parentId:null,title:'F1R3-'+alias,assignee,status,
        priority:alias==='T01'?'P0':'P1',
        progress:status==='done'?100:status==='wrapped'||alias==='T01'?20:0,
        startDate:day(-31),dueDate:day(dueOffset),
      }))
    }
  }
  for(let i=1;i<=2;i++)await record('FOREIGN'+i,addTask,{
    projectId:B.id,parentId:null,title:'F1R3-B-'+i,status:'todo',assignee:'',
    startDate:day(-31),dueDate:day(i===1?0:7),
  })
  save('base-ids.json',ids)
  const original=collectBackup(domain)
  save('base-before-history-content.json',original)
  const historical=structuredClone(original)
  for(const task of historical.tasks){
    task.createdAt=iso(-40)
    task.updatedAt=task.id===ids.T01?iso(-8):task.id===ids.B01?iso(-4):now.toISOString()
  }
  const text=JSON.stringify(historical,null,2)
  save('base-legal-history-content.json',historical)
  await precheckBackupContent(text)
  save('base-history-precheck.json',{at:new Date().toISOString(),method:'precheckBackupContent',completed:true,bytes:Buffer.byteLength(text),sha256:hash(text),date:D})
  const restored=await restoreBackupFromContent(domain,text,own+'/history-safety')
  save('base-history-restored.json',{at:new Date().toISOString(),safetySnapshot:restored.safetySnapshot,backup:restored.backup})
  const summary=await createBackup(domain,own+'/base-backups')
  const verified=await precheckBackupFile(summary.path)
  const content=fs.readFileSync(summary.path)
  fs.copyFileSync(summary.path,out+'/base-standard-backup.json',fs.constants.COPYFILE_EXCL)
  const sidecar=summary.path+'.files.'+verified.fileBundleId
  if(verified.fileBundleId)fs.cpSync(sidecar,out+'/base-standard-backup.json.files.'+verified.fileBundleId,{recursive:true,errorOnExist:true,force:false})
  const actual=verified.tasks.filter(t=>t.projectId===A.id)
  assert.equal(actual.length,24);assert(actual.every(t=>t.parentId===null))
  const counts=Object.fromEntries(['todo','in_progress','blocked','done','wrapped'].map(s=>[s,actual.filter(t=>t.status===s).length]))
  assert.deepEqual(counts,{todo:8,in_progress:6,blocked:2,done:7,wrapped:1})
  const facts=loadFacts(actual,{today:D}),suggestions=stanceSuggestions(actual,{today:D}),tags=staleStanceTags(actual,{today:D})
  const report=groupOpenTasksByAssignee(actual,verified.projects,{today:D})
  const scale=loadScale(report.people.map(r=>r.openTotal),report.unassigned.openTotal,5)
  assert.deepEqual(report.people.map(r=>r.openTotal).sort((a,b)=>a-b),[6,8])
  assert.equal(report.unassigned.openTotal,2);assert.equal(scale.maxX,10)
  assert(tags.some(t=>t.taskId===ids.T01));assert(suggestions.some(t=>t.taskId===ids.B01&&t.stance==='slow'))
  save('base-oracle.json',{
    at:new Date().toISOString(),date:D,ids,counts,taskCount:actual.length,foreignTasks:verified.tasks.filter(t=>t.projectId===B.id).length,
    officialDone:7,completionPercent:Math.round(7/24*100),open16:16,
    facts,suggestions,tags,report,peopleScale:scale,
    boardExpected:{max:13,members:{测试甲:{todo:5,inProgress:3,blocked:1,done:4},测试乙:{todo:2,inProgress:3,blocked:1,done:3}},unassignedOpen:2},
    productionPrecheckCompleted:true,mainGeneratedNotIndependentPass:true,
  })
  save('base-result.json',{at:new Date().toISOString(),date:D,own,pkg,standardPath:summary.path,copiedPath:out+'/base-standard-backup.json',bytes:content.length,sha256:hash(content),counts:summary.counts,bundleId:verified.fileBundleId,sourceCandidate:'CombinedF02RepairR2',mainGeneratedNotIndependentPass:true})
  console.log(JSON.stringify({prepared:true,date:D,A:A.id,B:B.id,counts,peopleScale:scale,backupSha256:hash(content)}))
}catch(e){save('base-error.json',{error:String(e),stack:e.stack,ids,actionCount:actions.length});throw e}
