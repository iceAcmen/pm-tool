import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const h=createHarness('P1004RepairGuiR2'),{browser,page}=await h.connect()
const gateway='/private/tmp/pmtool-combined-gui-runtime-20261022-r1/artifacts/response.json'
const requestLog=repo+'/reports/all-pending-evidence-20261021/CombinedGuiR1/gateway-requests.ndjson'
let stop,beforeGateway,beforeLog,gatewayChanged=false
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const saved=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/tasks/t-0006.json')).record
  const prior=JSON.parse(await fs.readFile(h.out+'/p1004prepare-normal-save-response.json'))
  assert.equal(prior.body.result.value.result.kind,'success')
  assert.equal(saved.progress,0);assert.equal(saved.assignee,'')
  await h.save('p1004prepare-actual-postsave-reconcile.json',{at:new Date().toISOString(),taskId:saved.id,progress:saved.progress,assignee:saved.assignee,originalOuterExit:1,originalReason:'Post-save reader incorrectly expected null; actual production TaskForm saves an empty string',normalSaveKind:'success',mainSaveReplayed:false})
  stop=await h.record(page,'p1004ask')
  await h.state(page,'p1004ask-zero-before')
  beforeGateway=await fs.readFile(gateway)
  beforeLog=await fs.readFile(requestLog)
  await h.save('gateway-before.json',beforeGateway.toString())
  const original=await fs.readFile(repo+'/reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/gateway-old-projection.json')
  assert.equal(JSON.parse(original).behavior,'success')
  await h.save('gateway-original-approved-projection.json',original.toString())
  await fs.writeFile(gateway,original);gatewayChanged=true
  await h.textButton(page,'AI 副驾')
  const selector='.pm-sidecar input[placeholder="问点什么，例如：下周会不会延期？"]'
  await page.waitForSelector(selector,{visible:true,timeout:5000})
  assert.equal(await page.$eval(selector,n=>n.value),'')
  await page.click(selector)
  await page.keyboard.type('P1004旧投影：只读说明 t-0006 当前负责人、进度和证据，不修改任务。')
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('/pm ask '),{timeout:30000})
  await page.click('.pm-sidecar button[aria-label="发送"]')
  const res=await waiting,body=await res.json()
  await h.save('p1004ask-real-response.json',{status:res.status(),request:JSON.parse(res.request().postData()),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>document.querySelector('.pm-sidecar')?.innerText.includes('当前没有建议写操作'),{timeout:5000})
  const open=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-sidecar button')].find(n=>n.innerText.trim()==='打开任务'))
  assert(open.asElement());await open.asElement().scrollIntoView()
  await h.state(page,'p1004ask-old-zero-projection-visible')
  await h.save('p1004ask-sidecar-old-text.json',{text:await page.$eval('.pm-sidecar',n=>n.innerText)})
  const afterLog=await fs.readFile(requestLog)
  assert(afterLog.subarray(0,beforeLog.length).equals(beforeLog))
  const appended=afterLog.subarray(beforeLog.length).toString().trim().split('\n').filter(Boolean).map(line=>JSON.parse(line))
  await h.save('p1004ask-real-gateway-requests.json',{beforeBytes:beforeLog.length,beforeSha256:h.sha(beforeLog),afterBytes:afterLog.length,appended})
  console.log({kind:body.result.value.result.kind,actualGatewayRequests:appended.length,actualTaskProgress:saved.progress})
}catch(e){
  await h.save('p1004ask-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'p1004ask-error-state')
  throw e
}finally{
  if(gatewayChanged){
    await fs.writeFile(gateway,beforeGateway)
    assert.deepEqual(await fs.readFile(gateway),beforeGateway)
    await h.save('gateway-restored-after-original-ask.json',{at:new Date().toISOString(),bytes:beforeGateway.length,sha256:h.sha(beforeGateway),same:true})
  }
  if(stop)await stop();await browser.disconnect()
}
