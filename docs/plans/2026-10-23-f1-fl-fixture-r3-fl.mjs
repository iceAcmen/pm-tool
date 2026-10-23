import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
const pkg='/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const out=repo+'/reports/all-pending-evidence-20261021/F1FLFixtureR3'
const own='/private/tmp/pmtool-f1-fl-fixture-20261023-r3-long'
assert(!fs.existsSync(own));fs.mkdirSync(own,{recursive:true})
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
const {updateTask}=await load('core/tasks')
const {addMilestone}=await load('core/milestones')
const {addMeeting}=await load('core/meetings')
const {addDeliverable}=await load('core/deliverables')
const {addOkr}=await load('core/okr')
const {addHabit}=await load('core/habits')
const {addLinkAttachment,addDeliverableAttachment,progressAppend,progressEditRevision,progressSoftDelete}=await load('core/task-materials')
const {collectBackup,precheckBackupFile,restoreBackup,precheckBackupContent,restoreBackupFromContent,createBackup}=await load('core/backup')
const {loadFacts,stanceSuggestions,staleStanceTags}=await load('core/load-stance')
const {groupOpenTasksByAssignee}=await load('core/people-load')
const {loadScale}=await load('client/views/people-scale')
const ctx=new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json',new JsonStorageBackend(own+'/domain'))
const facility=new DomainFacility(ctx,{backend:'json',routes:{}})
ctx.provide('storageDomain',facility);ctx.provide('commands',{register(){return()=>{}}})
await apply(ctx)
const domain=facility.get('pmtool')
const baseResult=JSON.parse(fs.readFileSync(out+'/base-result.json','utf8'))
const baseOracle=JSON.parse(fs.readFileSync(out+'/base-oracle.json','utf8'))
const ids={...baseOracle.ids,meeting:[],deliverable:[],okr:[],habit:[]}
const D=baseResult.date,now=new Date()
const localDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')
assert.equal(localDate,D)
const day=n=>new Date(Date.parse(D)+n*86400000).toISOString().slice(0,10)
const iso=n=>day(n)+'T00:00:00.000Z'
const text=(prefix,length)=>prefix+'长'.repeat(length-prefix.length)
const authorA=text('测试甲长姓名',80),authorB=text('测试乙长姓名',80)
const actions=[]
async function action(label,args,invoke){
  const result=await invoke()
  actions.push({label,at:new Date().toISOString(),args,result})
  save('fl-actions-'+actions.length+'.json',actions)
  return result
}
try{
  await precheckBackupFile(baseResult.standardPath)
  await restoreBackup(domain,baseResult.standardPath,own+'/initial-safety')
  for(const task of collectBackup(domain).tasks.filter(t=>t.projectId===ids.A)){
    const patch={title:text('FL-'+task.code+'-',240),description:text('FL说明-'+task.code+'-',2000),assignee:task.assignee==='测试甲'?authorA:task.assignee==='测试乙'?authorB:''}
    await action('task.update:'+task.id,{id:task.id,patch},()=>updateTask(domain,task.id,patch))
  }
  const milestone=await action('milestone.add',{projectId:ids.A,title:'FL-F3里程碑',targetDate:day(7)},()=>addMilestone(domain,{projectId:ids.A,title:'FL-F3里程碑',targetDate:day(7)}))
  ids.milestone=milestone.id
  for(let i=1;i<=20;i++){
    const suffix=String(i).padStart(2,'0')
    const meetingInput={projectId:ids.A,title:text('FL会议'+suffix+'-',240),meetingDate:D,summary:text('FL会议正文'+suffix+'-',2000),notes:text('FL会议备注'+suffix+'-',2000),participants:[authorA,authorB]}
    const meeting=await action('meeting.add:'+suffix,meetingInput,()=>addMeeting(domain,meetingInput));ids.meeting.push(meeting.id)
    const deliverableInput={projectId:ids.A,name:text('FL交付物'+suffix+'-',i===1?200:240),version:'V1',owner:authorA,description:text('FL交付物说明'+suffix+'-',2000),location:'https://example.com/fl/deliverable/'+suffix}
    const deliverable=await action('deliverable.add:'+suffix,deliverableInput,()=>addDeliverable(domain,deliverableInput));ids.deliverable.push(deliverable.id)
    const okrInput={title:text('FL目标'+suffix+'-',240),kind:'objective',owner:authorA,description:text('FL目标说明'+suffix+'-',2000),targetDate:day(7)}
    const okr=await action('okr.add:'+suffix,{projectId:ids.A,input:okrInput},()=>addOkr(domain,ids.A,okrInput));ids.okr.push(okr.id)
    const habitInput={title:text('FL习惯'+suffix+'-',240),goal:text('FL习惯目标'+suffix+'-',2000),frequency:'每天',notes:text('FL习惯备注'+suffix+'-',2000)}
    const habit=await action('habit.add:'+suffix,{projectId:ids.A,input:habitInput},()=>addHabit(domain,ids.A,habitInput));ids.habit.push(habit.id)
  }
  const tid=ids.T01
  await action('task.F3-relations',{id:tid,milestoneId:ids.milestone,deliverableId:ids.deliverable[0]},()=>updateTask(domain,tid,{milestoneId:ids.milestone,deliverableId:ids.deliverable[0]}))
  const linkInput={url:'https://example.com/qa-spec',title:text('FL链接标题-',200),note:text('FL链接备注-',500)}
  const link=await action('material.link',linkInput,()=>addLinkAttachment(domain,tid,linkInput));ids.link=link.id
  const dInput={deliverableId:ids.deliverable[0],note:'F3保留V1冻结'}
  const dlv=await action('material.deliverable',dInput,()=>addDeliverableAttachment(domain,tid,dInput));ids.deliverableAttachment=dlv.id
  for(const [alias,revisionCount,dateOffset]of [['E1',3,-2],['E2',2,-1],['E3',1,0]]){
    const input={date:day(dateOffset),author:authorA,content:text('FL-'+alias+'-首版-',2000),refs:[link.id]}
    let entry=await action('progress.add:'+alias,input,()=>progressAppend(domain,tid,input))
    ids[alias]=entry.id
    for(let r=2;r<=revisionCount;r++){
      const patch={date:day(Math.min(0,dateOffset+r-1)),author:r%2===0?authorB:authorA,content:text('FL-'+alias+'-第'+r+'版-',2000),refs:[link.id]}
      entry=await action('progress.edit:'+alias+':'+r,{entryId:entry.id,patch},()=>progressEditRevision(domain,tid,entry.id,patch))
    }
    if(alias==='E2')await action('progress.delete:E2',{entryId:entry.id},()=>progressSoftDelete(domain,tid,entry.id))
  }
  save('fl-ids.json',ids)
  const history=collectBackup(domain)
  for(const task of history.tasks){
    task.createdAt=iso(-40)
    task.updatedAt=task.id===ids.T01?iso(-8):task.id===ids.B01?iso(-4):now.toISOString()
  }
  const historyText=JSON.stringify(history,null,2)
  save('fl-legal-history-content.json',history)
  await precheckBackupContent(historyText)
  const restored=await restoreBackupFromContent(domain,historyText,own+'/history-safety')
  save('fl-history-restored.json',{safetySnapshot:restored.safetySnapshot,backup:restored.backup})
  const summary=await createBackup(domain,own+'/backups')
  const verified=await precheckBackupFile(summary.path)
  const bytes=fs.readFileSync(summary.path)
  fs.copyFileSync(summary.path,out+'/fl-standard-backup.json',fs.constants.COPYFILE_EXCL)
  if(verified.fileBundleId)fs.cpSync(summary.path+'.files.'+verified.fileBundleId,out+'/fl-standard-backup.json.files.'+verified.fileBundleId,{recursive:true,errorOnExist:true,force:false})
  const actual=verified.tasks.filter(t=>t.projectId===ids.A)
  assert.equal(actual.length,24);assert(actual.every(t=>t.parentId===null&&t.title.length===240&&t.description.length===2000))
  assert.equal(verified.meetings.filter(r=>r.projectId===ids.A).length,20)
  assert.equal(verified.deliverables.filter(r=>r.projectId===ids.A).length,20)
  assert.equal(verified.extra.okrs.filter(([,r])=>r.projectId===ids.A).length,20)
  assert.equal(verified.extra.habits.filter(([,r])=>r.projectId===ids.A).length,20)
  const target=actual.find(t=>t.id===tid)
  assert.equal(target.progressLog.find(e=>e.id===ids.E1).revisions.length,3)
  assert.equal(target.progressLog.find(e=>e.id===ids.E2).revisions.length,2)
  assert(target.progressLog.find(e=>e.id===ids.E2).deletedAt)
  const report=groupOpenTasksByAssignee(actual,verified.projects,{today:D})
  const facts=loadFacts(actual,{today:D}),suggestions=stanceSuggestions(actual,{today:D}),tags=staleStanceTags(actual,{today:D})
  const scale=loadScale(report.people.map(r=>r.openTotal),report.unassigned.openTotal,5)
  assert.equal(scale.maxX,10);assert(tags.some(t=>t.taskId===ids.T01));assert(suggestions.some(t=>t.taskId===ids.B01&&t.stance==='slow'))
  save('fl-oracle.json',{date:D,ids,facts,suggestions,tags,report,scale,longNames:[authorA,authorB],fieldLengths:{taskTitle:240,description:2000,linkTitle:200,linkNote:500,progressContent:2000,author:80},actualEach20:true,F1CountsPreserved:true,mainGeneratedNotIndependentPass:true})
  save('fl-result.json',{date:D,own,pkg,standardPath:summary.path,copiedPath:out+'/fl-standard-backup.json',bytes:bytes.length,sha256:hash(bytes),bundleId:verified.fileBundleId,counts:summary.counts,sourceCandidate:'CombinedF02RepairR2',mainGeneratedNotIndependentPass:true})
  console.log(JSON.stringify({prepared:true,date:D,taskCount:actual.length,eachKindCount:20,scale,bytes:bytes.length,backupSha256:hash(bytes)}))
}catch(e){save('fl-error.json',{error:String(e),stack:e.stack,ids,actionCount:actions.length});throw e}
