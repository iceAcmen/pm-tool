import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round21')
  await h.state(page,'round21-before-fixture-preparation')
  const newSession=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim().startsWith('新会话')))
  assert(newSession.asElement());await newSession.asElement().click()
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
  const before=await h.command(page,'/pm web snapshot','round21-before-snapshot')
  const original=JSON.parse(before.result.value.result.text)
  await h.save('round21-before-live-snapshot.json',original)
  const fixtureName='QA-E-habit-negative-20261023'
  assert(!original.projects.some(p=>p.name===fixtureName))
  assert(!original.okrs.some(o=>o.id==='okr-not-found-20261023'))
  const cross=original.okrs.find(o=>o.id==='okr-mvk2mw6p-xiusuv')
  assert(cross);assert.equal(cross.projectId,'p-0002')
  const result=await h.command(page,'/pm project add '+JSON.stringify({name:fixtureName,startDate:'2026-10-23',targetDate:'2026-11-30'}),'round21-create-E')
  assert.equal(result.result.value.result.kind,'success')
  const snap=await h.command(page,'/pm web snapshot','round21-after-E-snapshot')
  const withProject=JSON.parse(snap.result.value.result.text)
  const E=withProject.projects.find(p=>p.name===fixtureName)
  assert(E);assert(!withProject.okrs.some(o=>o.projectId===E.id))
  const Hfields={title:'负例夹具习惯H',goal:'已存目标原文',frequency:'每天',notes:'已存备注原文'}
  const added=await h.command(page,'/pm habit add '+E.id+' '+JSON.stringify(Hfields),'round21-create-H')
  assert.equal(added.result.value.result.kind,'success')
  const after=await h.command(page,'/pm web snapshot','round21-after-H-snapshot')
  const snapshot=JSON.parse(after.result.value.result.text)
  const H=snapshot.habits.find(h=>h.projectId===E.id&&h.title===Hfields.title)
  assert(H);assert(!H.okrId)
  await h.save('round21-fixture-identity.json',{scope:'RA-P3004 negative fixture clarification only',E,H,cross,missingId:'okr-not-found-20261023'})
  await h.save('round21-after-preparation-live-snapshot.json',snapshot)
  await h.state(page,'round21-after-fixture-preparation')
  console.log(JSON.stringify({E:{id:E.id,name:E.name},H:{id:H.id,title:H.title},cross:{id:cross.id,projectId:cross.projectId}}))
} catch(e) {
  await h.save('round21-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round21-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}
