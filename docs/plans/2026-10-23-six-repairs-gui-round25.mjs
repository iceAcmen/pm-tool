import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round25')
  await h.state(page,'round25-before-normal-habit-cancel')
  const cancel=await page.evaluateHandle(()=>[...document.querySelectorAll('.gf-actions button')].find(n=>n.innerText.trim()==='取消'))
  assert(cancel.asElement());await cancel.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('[role=dialog]'),{timeout:6000})
  await h.state(page,'round25-after-normal-habit-cancel')
  const session=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim().startsWith('新会话')))
  assert(session.asElement());await session.asElement().click()
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
  const response=await h.command(page,'/pm web snapshot','round25-final-snapshot')
  assert.equal(response.result.value.result.kind,'success')
  const snapshot=JSON.parse(response.result.value.result.text)
  await h.save('round25-final-live-snapshot.json',snapshot)
  await h.state(page,'round25-final-after-readonly-snapshot')
  console.log(JSON.stringify({projects:snapshot.projects.map(p=>({id:p.id,name:p.name})),habits:snapshot.habits.map(h=>({id:h.id,projectId:h.projectId,title:h.title,okrId:h.okrId}))}))
} catch(e) {
  await h.save('round25-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round25-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}
